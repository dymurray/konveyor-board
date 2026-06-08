import { env } from "../config.ts";
import type { JiraTicket } from "../types.ts";
import { transformJiraIssues } from "./transform.ts";

const JIRA_BASE = "https://redhat.atlassian.net";
const JIRA_BROWSE = `${JIRA_BASE}/browse`;
const JIRA_API = `${JIRA_BASE}/rest/api/3`;

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${env.jiraEmail}:${env.jiraApiToken}`).toString("base64");
}

export async function fetchJiraTickets(accountIds: string[]): Promise<JiraTicket[]> {
  if (!env.jiraEmail || !env.jiraApiToken) {
    return [];
  }

  const quotedIds = accountIds.map((id) => `"${id}"`).join(", ");
  const jql = `assignee in (${quotedIds}) AND project = "MTA" AND resolution is EMPTY ORDER BY updated DESC`;

  const params = new URLSearchParams({
    jql,
    maxResults: "200",
    fields: "summary,status,priority,issuetype,assignee,updated,created",
  });

  const res = await fetch(`${JIRA_API}/search?${params.toString()}`, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { issues: any[] };
  return transformJiraIssues(data.issues, JIRA_BROWSE);
}
