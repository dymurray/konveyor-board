import type { ProjectItem, ProjectColumn, Label, TeamMember, AuthUser, JiraTicket, ReleaseConfig } from "../types/project";
import { getToken, getAuthHeaders, clearToken } from "./token";
import { fetchProject, updateProjectItemStatus } from "./github-graphql";
import { setAssignees, addLabels, removeLabel, fetchRepoLabels } from "./github-rest";
import { searchMilestoneIssues } from "./github-search";
import { fetchJiraByFixVersion, fetchJiraByFixVersions, fetchAllJiraTickets } from "./jira";
import { invalidateCache } from "./cache";
import { getOrg, getProjectNumber, getTeamMembers, getReleaseConfig } from "./config";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

function handleAuthError(): never {
  clearToken();
  onAuthFailure?.();
  throw new ApiError(401, "Not authenticated");
}

export const api = {
  getItems: async (projectId: number) => {
    if (!getToken()) handleAuthError();
    try {
      const result = await fetchProject(getOrg(), projectId || getProjectNumber());
      return { projectNodeId: result.projectNodeId, items: result.items, currentSprint: result.currentSprint };
    } catch (e) {
      if (e instanceof Error && e.message.includes("401")) handleAuthError();
      throw e;
    }
  },

  getColumns: async (projectId: number): Promise<ProjectColumn[]> => {
    if (!getToken()) handleAuthError();
    try {
      const result = await fetchProject(getOrg(), projectId || getProjectNumber());
      return result.columns;
    } catch (e) {
      if (e instanceof Error && e.message.includes("401")) handleAuthError();
      throw e;
    }
  },

  updateStatus: async (_projectId: number, itemId: string, body: { fieldId: string; optionId: string; projectId: string }): Promise<{ ok: boolean }> => {
    if (!getToken()) handleAuthError();
    await updateProjectItemStatus(body.projectId, itemId, body.fieldId, body.optionId);
    invalidateCache("project:");
    return { ok: true };
  },

  setAssignees: async (owner: string, repo: string, issueNumber: number, assignees: string[]): Promise<{ ok: boolean }> => {
    if (!getToken()) handleAuthError();
    await setAssignees(owner, repo, issueNumber, assignees);
    invalidateCache("project:");
    return { ok: true };
  },

  addLabels: async (owner: string, repo: string, issueNumber: number, labels: string[]): Promise<{ ok: boolean }> => {
    if (!getToken()) handleAuthError();
    await addLabels(owner, repo, issueNumber, labels);
    invalidateCache("project:");
    return { ok: true };
  },

  removeLabel: async (owner: string, repo: string, issueNumber: number, label: string): Promise<{ ok: boolean }> => {
    if (!getToken()) handleAuthError();
    await removeLabel(owner, repo, issueNumber, label);
    invalidateCache("project:");
    return { ok: true };
  },

  getRepoLabels: async (owner: string, repo: string): Promise<Label[]> => {
    if (!getToken()) handleAuthError();
    return fetchRepoLabels(owner, repo);
  },

  getTeam: async (): Promise<TeamMember[]> => {
    return getTeamMembers();
  },

  getMe: async (): Promise<AuthUser> => {
    const token = getToken();
    if (!token) handleAuthError();

    const res = await fetch("https://api.github.com/user", {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) handleAuthError();
    if (!res.ok) throw new ApiError(res.status, `GitHub user API error: ${res.statusText}`);

    const data = await res.json();
    return {
      login: data.login,
      avatarUrl: data.avatar_url,
      name: data.name ?? data.login,
    };
  },

  logout: async (): Promise<{ ok: boolean }> => {
    clearToken();
    return { ok: true };
  },

  getJiraTickets: async (fixVersion?: string | string[], sprint?: string): Promise<JiraTicket[]> => {
    if (Array.isArray(fixVersion)) {
      return fixVersion.length > 0 ? await fetchJiraByFixVersions(fixVersion, sprint) : await fetchAllJiraTickets();
    }
    return fixVersion ? await fetchJiraByFixVersion(fixVersion, sprint) : await fetchAllJiraTickets();
  },

  getMilestoneIssues: async (milestone: string): Promise<ProjectItem[]> => {
    if (!getToken()) handleAuthError();
    return searchMilestoneIssues(getOrg(), milestone);
  },

  getConfig: async (): Promise<{ release: ReleaseConfig | null }> => {
    return { release: getReleaseConfig() };
  },
};
