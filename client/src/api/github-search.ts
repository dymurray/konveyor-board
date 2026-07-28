import type { ProjectItem } from "../types/project";
import { getAuthHeaders } from "./token";

const GITHUB_API = "https://api.github.com";

export async function searchMilestoneIssues(
  org: string,
  milestone: string,
): Promise<ProjectItem[]> {
  const items: ProjectItem[] = [];
  let page = 1;

  while (true) {
    const q = encodeURIComponent(`is:issue is:open milestone:"${milestone}" org:${org}`);
    const res = await fetch(`${GITHUB_API}/search/issues?q=${q}&per_page=100&page=${page}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub search error ${res.status}: ${text}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;

    for (const issue of data.items) {
      if (issue.pull_request) continue;

      const repoParts = issue.repository_url.split("/");
      const repoName = repoParts[repoParts.length - 1];
      const repoOwner = repoParts[repoParts.length - 2];

      items.push({
        id: `search-${issue.node_id}`,
        issueId: issue.node_id,
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        state: issue.state === "open" ? "OPEN" : "CLOSED",
        url: issue.html_url,
        repo: repoName,
        repoOwner: repoOwner,
        status: "",
        statusOptionId: "",
        assignees: (issue.assignees ?? []).map((a: { login: string; avatar_url: string }) => ({
          login: a.login,
          avatarUrl: a.avatar_url,
        })),
        labels: (issue.labels ?? []).map((l: string | { name?: string; color?: string }) => {
          if (typeof l === "string") return { name: l, color: "ededed" };
          return { name: l.name ?? "", color: l.color ?? "ededed" };
        }),
        milestone: issue.milestone?.title ?? "",
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        sprint: "",
      });
    }

    if (data.items.length < 100) break;
    page++;
  }

  return items;
}
