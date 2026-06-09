import { Octokit } from "@octokit/rest";
import type { ProjectItem } from "../types.ts";

export async function searchMilestoneIssues(
  token: string,
  org: string,
  milestone: string,
): Promise<ProjectItem[]> {
  const client = new Octokit({ auth: token });
  const items: ProjectItem[] = [];
  let page = 1;

  while (true) {
    const { data } = await client.search.issuesAndPullRequests({
      q: `is:issue is:open milestone:"${milestone}" org:${org}`,
      per_page: 100,
      page,
    });

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
        assignees: (issue.assignees ?? []).map((a) => ({
          login: a.login,
          avatarUrl: a.avatar_url,
        })),
        labels: (issue.labels ?? []).map((l) => {
          if (typeof l === "string") return { name: l, color: "ededed" };
          return { name: l.name ?? "", color: l.color ?? "ededed" };
        }),
        milestone: issue.milestone?.title ?? "",
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      });
    }

    if (data.items.length < 100) break;
    page++;
  }

  return items;
}
