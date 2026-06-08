import type { JiraTicket } from "../types.ts";

export function transformJiraIssues(issues: any[], baseUrl: string): JiraTicket[] {
  return issues.map((issue: any) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? "Unknown",
    priority: issue.fields.priority?.name ?? "None",
    issueType: issue.fields.issuetype?.name ?? "Unknown",
    assigneeId: issue.fields.assignee?.accountId ?? "",
    url: `${baseUrl}/${issue.key}`,
    updatedAt: issue.fields.updated,
    createdAt: issue.fields.created,
  }));
}
