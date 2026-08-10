import { env } from "../config.ts";
import type { JiraTicket } from "../types.ts";
import { transformJiraIssues } from "./transform.ts";

const JIRA_BASE = "https://redhat.atlassian.net";
const JIRA_BROWSE = `${JIRA_BASE}/browse`;
const JIRA_API = `${JIRA_BASE}/rest/api/3`;

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${env.jiraEmail}:${env.jiraApiToken}`).toString("base64");
}

export async function fetchJiraTickets(accountIds: string[], sprint?: string): Promise<JiraTicket[]> {
  if (!env.jiraEmail || !env.jiraApiToken) {
    return [];
  }

  const quotedIds = accountIds.map((id) => `"${id}"`).join(", ");
  let jql = `assignee in (${quotedIds}) AND project = "MTA" AND resolution is EMPTY AND status not in ("Verified", "Closed")`;
  if (sprint) jql += ` AND sprint = "${sprint}"`;
  jql += ` ORDER BY updated DESC`;

  const res = await fetch(`${JIRA_API}/search/jql`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jql,
      maxResults: 200,
      fields: ["summary", "status", "priority", "issuetype", "assignee", "updated", "created", "fixVersions"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { issues: any[] };
  return transformJiraIssues(data.issues, JIRA_BROWSE);
}

export async function fetchJiraByFixVersion(fixVersion: string, sprint?: string): Promise<JiraTicket[]> {
  if (!env.jiraEmail || !env.jiraApiToken) {
    return [];
  }

  let jql = `project = "MTA" AND fixVersion = "${fixVersion}" AND resolution is EMPTY AND status not in ("Verified", "Closed")`;
  if (sprint) jql += ` AND sprint = "${sprint}"`;
  jql += ` ORDER BY updated DESC`;

  const res = await fetch(`${JIRA_API}/search/jql`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jql,
      maxResults: 200,
      fields: ["summary", "status", "priority", "issuetype", "assignee", "updated", "created", "fixVersions"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { issues: any[] };
  return transformJiraIssues(data.issues, JIRA_BROWSE);
}

export async function fetchAllJiraTickets(sprint?: string): Promise<JiraTicket[]> {
  if (!env.jiraEmail || !env.jiraApiToken) {
    return [];
  }

  let jql = `project = "MTA" AND resolution is EMPTY AND status not in ("Verified", "Closed")`;
  if (sprint) jql += ` AND sprint = "${sprint}"`;
  jql += ` ORDER BY updated DESC`;

  const res = await fetch(`${JIRA_API}/search/jql`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jql,
      maxResults: 200,
      fields: ["summary", "status", "priority", "issuetype", "assignee", "updated", "created", "fixVersions"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { issues: any[] };
  return transformJiraIssues(data.issues, JIRA_BROWSE);
}
