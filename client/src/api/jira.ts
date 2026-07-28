import type { JiraTicket } from "../types/project";
import { getJiraCredentials, getJiraProxyUrl } from "./token";

const JIRA_BASE = "https://redhat.atlassian.net";
const JIRA_BROWSE = `${JIRA_BASE}/browse`;
const JIRA_API = `${JIRA_BASE}/rest/api/3`;

function getJiraAuthHeader(email: string, apiToken: string): string {
  return "Basic " + btoa(`${email}:${apiToken}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformJiraIssues(issues: any[]): JiraTicket[] {
  return issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? "Unknown",
    priority: issue.fields.priority?.name ?? "None",
    issueType: issue.fields.issuetype?.name ?? "Unknown",
    assigneeId: issue.fields.assignee?.accountId ?? "",
    url: `${JIRA_BROWSE}/${issue.key}`,
    updatedAt: issue.fields.updated,
    createdAt: issue.fields.created,
    fixVersion: issue.fields.fixVersions?.[0]?.name ?? "",
  }));
}

async function jiraSearch(jql: string): Promise<JiraTicket[]> {
  const creds = getJiraCredentials();
  const proxyUrl = getJiraProxyUrl();
  if (!creds || !proxyUrl) return [];

  const targetUrl = `${JIRA_API}/search/jql`;
  const body = JSON.stringify({
    jql,
    maxResults: 200,
    fields: ["summary", "status", "priority", "issuetype", "assignee", "updated", "created", "fixVersions"],
  });

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      Authorization: getJiraAuthHeader(creds.email, creds.apiToken),
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Target-Url": targetUrl,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as { issues: any[] };
  return transformJiraIssues(data.issues);
}

export async function fetchJiraByFixVersion(fixVersion: string): Promise<JiraTicket[]> {
  const jql = `project = "MTA" AND fixVersion = "${fixVersion}" AND resolution is EMPTY AND status not in ("Verified", "Closed") ORDER BY updated DESC`;
  return jiraSearch(jql);
}

export async function fetchAllJiraTickets(): Promise<JiraTicket[]> {
  const jql = `project = "MTA" AND resolution is EMPTY AND status not in ("Verified", "Closed") ORDER BY updated DESC`;
  return jiraSearch(jql);
}
