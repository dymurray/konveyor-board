import { Router } from "express";
import { teamConfig } from "../config.ts";

export const teamRouter = Router();

teamRouter.get("/", (_req, res) => {
  const members = teamConfig.engineers.map((e) => ({
    name: e.name,
    github: e.github,
    jira_account_id: e.jira_account_id,
    role: e.role,
  }));
  res.json(members);
});
