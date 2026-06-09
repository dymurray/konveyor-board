import { Router } from "express";
import { dashboardConfig } from "../config.ts";

export const configRouter = Router();

configRouter.get("/", (_req, res) => {
  res.json({ release: dashboardConfig.release ?? null });
});
