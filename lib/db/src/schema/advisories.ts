import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const advisoriesTable = pgTable("advisories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  farmName: text("farm_name").notNull(),
  stateRegion: text("state_region").notNull(),
  district: text("district").notNull(),
  soilType: text("soil_type").notNull(),
  soilPh: text("soil_ph").notNull(),
  averageTemperature: text("average_temperature").notNull(),
  averageRainfall: text("average_rainfall").notNull(),
  humidity: text("humidity").notNull(),
  irrigationAvailability: text("irrigation_availability").notNull(),
  season: text("season").notNull(),
  landSize: text("land_size").notNull(),
  landUnit: text("land_unit").notNull(),
  previousCrop: text("previous_crop").notNull(),
  farmingObjective: text("farming_objective").notNull(),
  preferredCrop: text("preferred_crop"),
  additionalNotes: text("additional_notes"),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdvisorySchema = createInsertSchema(advisoriesTable).omit({
  createdAt: true,
});
export type InsertAdvisory = z.infer<typeof insertAdvisorySchema>;
export type Advisory = typeof advisoriesTable.$inferSelect;