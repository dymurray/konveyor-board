import type { TeamMember, ReleaseConfig } from "../types/project";

interface DashboardConfig {
  github: { org: string; projectNumber: number };
  polling: { intervalMs: number; cacheTtlMs: number };
  release?: { githubMilestone: string; jiraFixVersion: string };
}

interface TeamConfig {
  engineers: TeamMember[];
}

declare const __TEAM_CONFIG__: TeamConfig;
declare const __DASHBOARD_CONFIG__: DashboardConfig;

export const teamConfig: TeamConfig = typeof __TEAM_CONFIG__ !== "undefined"
  ? __TEAM_CONFIG__
  : { engineers: [] };

export const dashboardConfig: DashboardConfig = typeof __DASHBOARD_CONFIG__ !== "undefined"
  ? __DASHBOARD_CONFIG__
  : { github: { org: "konveyor", projectNumber: 67 }, polling: { intervalMs: 30000, cacheTtlMs: 60000 } };

export function getOrg(): string {
  return dashboardConfig.github.org;
}

export function getProjectNumber(): number {
  return dashboardConfig.github.projectNumber;
}

export function getPollInterval(): number {
  return dashboardConfig.polling.intervalMs;
}

export function getReleaseConfig(): ReleaseConfig | null {
  return dashboardConfig.release ?? null;
}

export function getTeamMembers(): TeamMember[] {
  return teamConfig.engineers;
}
