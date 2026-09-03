import type { JiraTicket, ProjectItem, TeamMember } from "../types/project";

// Color for the issue-type badge shown on Jira cards/rows. Vulnerabilities and
// bugs read as red; everything else uses the same blue as the Jira accent.
function issueTypeColor(issueType: string): string {
  const t = issueType.toLowerCase();
  if (t === "vulnerability" || t === "bug") return "da3633";
  return "1f6feb";
}

// The numeric part of a Jira key (MTA-7642 -> 7642), used for the card's
// "#<number>" affordance. Falls back to 0 when the key has no number.
function keyNumber(key: string): number {
  const m = key.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

/**
 * Adapt a Jira ticket into a ProjectItem so it can flow through the same
 * filters, board, list, and engineer grouping as GitHub items. The item is
 * tagged `source: "jira"` so the UI can render it read-only and route clicks to
 * the Jira URL.
 *
 * Assignees are mapped from the ticket's Jira account id to the matching team
 * member's GitHub login, so a Jira item groups under the same engineer as their
 * GitHub work. Tickets with no assignee (or an assignee not on the team) come
 * back with an empty assignees array and land in the Unassigned bucket.
 */
export function jiraToProjectItem(
  ticket: JiraTicket,
  teamByJiraId: Map<string, TeamMember>,
  sprint?: string,
): ProjectItem {
  const member = ticket.assigneeId ? teamByJiraId.get(ticket.assigneeId) : undefined;
  const assignees = member ? [{ login: member.github, name: member.name, avatarUrl: "" }] : [];

  return {
    id: `jira:${ticket.key}`,
    issueId: ticket.key,
    number: keyNumber(ticket.key),
    title: ticket.summary,
    body: "",
    state: "OPEN",
    url: ticket.url,
    // Jira items have no GitHub repo; left blank so they don't pollute the repo
    // filter (see useFilters, which drops empty repos).
    repo: "",
    repoOwner: "",
    status: ticket.status,
    statusOptionId: "",
    assignees,
    labels: [{ name: ticket.issueType, color: issueTypeColor(ticket.issueType) }],
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    milestone: ticket.fixVersion,
    sprint: sprint ?? "",
    source: "jira",
    issueType: ticket.issueType,
  };
}

// True for Jira items that represent a security vulnerability (CVE). Used to
// route them into the dedicated Security section rather than per-engineer lists.
export function isCve(item: ProjectItem): boolean {
  return item.source === "jira" && (item.issueType ?? "").toLowerCase() === "vulnerability";
}
