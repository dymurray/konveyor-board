import { getAuthHeaders } from "./token";

const GITHUB_API = import.meta.env.VITE_GITHUB_API || "https://api.github.com";

async function githubFetch(path: string, opts?: RequestInit): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...opts,
    headers: {
      ...getAuthHeaders(),
      ...opts?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res;
}

export async function setAssignees(
  owner: string,
  repo: string,
  issueNumber: number,
  assignees: string[],
): Promise<void> {
  await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ assignees }),
  });
}

export async function addLabels(
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[],
): Promise<void> {
  await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

export async function removeLabel(
  owner: string,
  repo: string,
  issueNumber: number,
  label: string,
): Promise<void> {
  await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`, {
    method: "DELETE",
  });
}

export async function fetchRepoLabels(
  owner: string,
  repo: string,
): Promise<{ name: string; color: string }[]> {
  const res = await githubFetch(`/repos/${owner}/${repo}/labels?per_page=100`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any[];
  return data.map((l) => ({ name: l.name, color: l.color ?? "ededed" }));
}
