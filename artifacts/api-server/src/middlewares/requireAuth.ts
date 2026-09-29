import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = userId;
  next();
}

export function getAuthenticatedUserId(res: Response): string {
  const userId = res.locals.userId;
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Authenticated user is missing");
  }
  return userId;
}