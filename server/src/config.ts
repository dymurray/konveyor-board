import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { DashboardConfig, TeamConfig } from "./types.ts";

loadEnv({ path: resolve(import.meta.dirname, "../../.env") });

const rootDir = resolve(import.meta.dirname, "../..");

export const dashboardConfig: DashboardConfig = JSON.parse(
  readFileSync(resolve(rootDir, "dashboard-config.json"), "utf-8"),
) as DashboardConfig;

export const teamConfig: TeamConfig = JSON.parse(
  readFileSync(resolve(rootDir, "team-config.json"), "utf-8"),
) as TeamConfig;

export const env = {
  githubClientId: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret",
  port: parseInt(process.env.PORT ?? "3001", 10),
  jiraEmail: process.env.JIRA_EMAIL ?? "",
  jiraApiToken: process.env.JIRA_API_TOKEN ?? "",
};
