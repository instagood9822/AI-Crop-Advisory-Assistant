import { clerkClient } from "@clerk/express";
import { GoogleGenAI } from "@google/genai";
import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  CreateAdvisoryBody,
  CreateAdvisoryResponse,
  DeleteAdvisoryParams,
  GetAdvisoryParams,
  GetAdvisoryResponse,
  GetDashboardSummaryResponse,
  GetProfileResponse,
  ListAdvisoriesResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { db, advisoriesTable } from "@workspace/db";
import { getAuthenticatedUserId, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const advisoryResultSchema = z.object({
  summary: z.string(),
  recommendedCrops: z.array(
    z.object({
      name: z.string(),
      suitabilityScore: z.number().int().min(0).max(100),
      whyItFits: z.string(),
      growingConditions: z.array(z.string()),
      soilConsiderations: z.string(),
      waterRequirements: z.string(),
      nutrientConsiderations: z.string(),
      potentialRisks: z.array(z.string()),
      preventiveMeasures: z.array(z.string()),
    }),
  ),
  generalPrecautions: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  expertConsultationRecommended: z.boolean(),
  safetyNote: z.string(),
});

function toSummary(row: typeof advisoriesTable.$inferSelect) {
  const result = advisoryResultSchema.parse(row.result);
  const topCrop = result.recommendedCrops[0];
  return {
    id: row.id,
    farmName: row.farmName,
    location: `${row.district}, ${row.stateRegion}`,
    season: row.season,
    topCrop: topCrop?.name ?? "Review recommended crops",
    suitabilityScore: topCrop?.suitabilityScore ?? 0,
    createdAt: row.createdAt,
  };
}

function toAdvisory(row: typeof advisoriesTable.$inferSelect) {
  return GetAdvisoryResponse.parse({
    ...toSummary(row),
    userId: row.userId,
    farmConditions: {
      farmName: row.farmName,
      stateRegion: row.stateRegion,
      district: row.district,
      soilType: row.soilType,
      soilPh: Number(row.soilPh),
      averageTemperature: Number(row.averageTemperature),
      averageRainfall: Number(row.averageRainfall),
      humidity: Number(row.humidity),
      irrigationAvailability: row.irrigationAvailability,
      season: row.season,
      landSize: Number(row.landSize),
      landUnit: row.landUnit,
      previousCrop: row.previousCrop,
      farmingObjective: row.farmingObjective,
      preferredCrop: row.preferredCrop,
      additionalNotes: row.additionalNotes,
    },
    result: advisoryResultSchema.parse(row.result),
  });
}

async function getProfile(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  return GetProfileResponse.parse({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    firstName: user.firstName,
    lastName: user.lastName,
    displayName:
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "Farmer",
  });
}

function buildPrompt(input: z.infer<typeof CreateAdvisoryBody>): string {
  return `You are a careful agricultural advisory assistant. Return only valid JSON matching the requested structure. Use the farmer's information as known facts, and label uncertainty clearly. Recommendations are general guidance, not guaranteed outcomes. Recommend consulting a qualified local agronomist for unusual, high-risk, or potentially harmful situations.

Farm details:
${JSON.stringify(input, null, 2)}

Return an object with:
{
  "summary": "short plain-language overview",
  "recommendedCrops": [
    {
      "name": "crop name",
      "suitabilityScore": 0,
      "whyItFits": "plain-language explanation",
      "growingConditions": ["condition"],
      "soilConsiderations": "soil guidance",
      "waterRequirements": "water guidance",
      "nutrientConsiderations": "basic nutrient guidance",
      "potentialRisks": ["risk"],
      "preventiveMeasures": ["prevention"]
    }
  ],
  "generalPrecautions": ["precaution"],
  "suggestedNextSteps": ["next step"],
  "expertConsultationRecommended": false,
  "safetyNote": "clear non-guarantee and local-expert note"
}

Give 3 ranked crop options when reasonable. Never recommend unsafe chemical rates or claim certainty.`;
}

router.use(requireAuth);

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(res);
  const [profile, total, rows] = await Promise.all([
    getProfile(userId),
    db
      .select({ value: count() })
      .from(advisoriesTable)
      .where(eq(advisoriesTable.userId, userId)),
    db
      .select()
      .from(advisoriesTable)
      .where(eq(advisoriesTable.userId, userId))
      .orderBy(desc(advisoriesTable.createdAt))
      .limit(4),
  ]);

  res.json(
    GetDashboardSummaryResponse.parse({
      profile,
      advisoryCount: Number(total[0]?.value ?? 0),
      recentAdvisories: rows.map(toSummary),
    }),
  );
});

router.get("/advisories", async (_req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(res);
  const rows = await db
    .select()
    .from(advisoriesTable)
    .where(eq(advisoriesTable.userId, userId))
    .orderBy(desc(advisoriesTable.createdAt));
  res.json(ListAdvisoriesResponse.parse(rows.map(toSummary)));
});

router.post("/advisories", async (req, res): Promise<void> => {
  const parsed = CreateAdvisoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(parsed.data),
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });
    const raw = response.text;
    if (!raw) {
      res.status(502).json({ error: "The advisory model returned no content." });
      return;
    }
    const result = advisoryResultSchema.parse(JSON.parse(raw));
    const userId = getAuthenticatedUserId(res);
    const [row] = await db
      .insert(advisoriesTable)
      .values({
        userId,
        farmName: parsed.data.farmName,
        stateRegion: parsed.data.stateRegion,
        district: parsed.data.district,
        soilType: parsed.data.soilType,
        soilPh: String(parsed.data.soilPh),
        averageTemperature: String(parsed.data.averageTemperature),
        averageRainfall: String(parsed.data.averageRainfall),
        humidity: String(parsed.data.humidity),
        irrigationAvailability: parsed.data.irrigationAvailability,
        season: parsed.data.season,
        landSize: String(parsed.data.landSize),
        landUnit: parsed.data.landUnit,
        previousCrop: parsed.data.previousCrop,
        farmingObjective: parsed.data.farmingObjective,
        preferredCrop: parsed.data.preferredCrop ?? null,
        additionalNotes: parsed.data.additionalNotes ?? null,
        result,
      })
      .returning();

    res.status(201).json(CreateAdvisoryResponse.parse(toAdvisory(row)));
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? `Unable to generate advisory: ${error.message}`
          : "Unable to generate advisory.",
    });
  }
});

router.get("/advisories/:id", async (req, res): Promise<void> => {
  const params = GetAdvisoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getAuthenticatedUserId(res);
  const [row] = await db
    .select()
    .from(advisoriesTable)
    .where(
      and(
        eq(advisoriesTable.id, params.data.id),
        eq(advisoriesTable.userId, userId),
      ),
    );
  if (!row) {
    res.status(404).json({ error: "Advisory not found" });
    return;
  }
  res.json(GetAdvisoryResponse.parse(toAdvisory(row)));
});

router.delete("/advisories/:id", async (req, res): Promise<void> => {
  const params = DeleteAdvisoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getAuthenticatedUserId(res);
  const [row] = await db
    .delete(advisoriesTable)
    .where(
      and(
        eq(advisoriesTable.id, params.data.id),
        eq(advisoriesTable.userId, userId),
      ),
    )
    .returning({ id: advisoriesTable.id });
  if (!row) {
    res.status(404).json({ error: "Advisory not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/profile", async (_req, res): Promise<void> => {
  const profile = await getProfile(getAuthenticatedUserId(res));
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const user = await clerkClient.users.updateUser(getAuthenticatedUserId(res), {
    ...(data.firstName !== undefined ? { firstName: data.firstName ?? "" } : {}),
    ...(data.lastName !== undefined ? { lastName: data.lastName ?? "" } : {}),
  });
  res.json(
    UpdateProfileResponse.parse({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      displayName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "Farmer",
    }),
  );
});

export default router;