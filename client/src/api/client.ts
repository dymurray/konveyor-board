import type { ProjectItem, ProjectColumn, Label, TeamMember, AuthUser, JiraTicket, ReleaseConfig } from "../types/project";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = "/api/auth/github";
    throw new ApiError(401, "Not authenticated");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  return (await res.json()) as T;
}

export const api = {
  getItems: (projectId: number) => request<{ projectNodeId: string; items: ProjectItem[] }>(`/api/project/${projectId}/items`),

  getColumns: (projectId: number) => request<ProjectColumn[]>(`/api/project/${projectId}/columns`),

  updateStatus: (projectId: number, itemId: string, body: { fieldId: string; optionId: string; projectId: string }) =>
    request<{ ok: boolean }>(`/api/project/${projectId}/items/${itemId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  setAssignees: (owner: string, repo: string, issueNumber: number, assignees: string[]) =>
    request<{ ok: boolean }>(`/api/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
      method: "PATCH",
      body: JSON.stringify({ assignees }),
    }),

  addLabels: (owner: string, repo: string, issueNumber: number, labels: string[]) =>
    request<{ ok: boolean }>(`/api/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels }),
    }),

  removeLabel: (owner: string, repo: string, issueNumber: number, label: string) =>
    request<{ ok: boolean }>(`/api/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`, {
      method: "DELETE",
    }),

  getRepoLabels: (owner: string, repo: string) => request<Label[]>(`/api/repos/${owner}/${repo}/labels`),

  getTeam: () => request<TeamMember[]>("/api/team"),

  getMe: () => request<AuthUser>("/api/auth/me"),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  getJiraTickets: () => request<JiraTicket[]>("/api/jira/tickets"),

  getConfig: () => request<{ release: ReleaseConfig | null }>("/api/config"),
};
