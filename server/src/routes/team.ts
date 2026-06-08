import { Router } from "express";
import { teamConfig } from "../config.ts";

export const teamRouter = Router();

teamRouter.get("/", (_req, res) => {
  const members = teamConfig.engineers.map((e) => ({
    name: e.name,
    github: e.github,
    role: e.role,
  }));
  res.json(members);
});
