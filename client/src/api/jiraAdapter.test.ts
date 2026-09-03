import { describe, it, expect } from "vitest";
import { jiraToProjectItem, isCve } from "./jiraAdapter";
import type { JiraTicket, TeamMember } from "../types/project";

const member: TeamMember = {
  name: "Ian Bolton",
  github: "ibolton336",
  jira_account_id: "70121:b4421d8e-14c3-4430-bd8e-30b46a985671",
  role: "engineer",
};

const teamByJiraId = new Map([[member.jira_account_id, member]]);

function ticket(overrides: Partial<JiraTicket> = {}): JiraTicket {
  return {
    key: "MTA-7642",
    summary: "CVE-2026-69243 aiohttp: HTTP request smuggling",
    status: "New",
    priority: "Major",
    issueType: "Vulnerability",
    assigneeId: "",
    url: "https://redhat.atlassian.net/browse/MTA-7642",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
    fixVersion: "MTA 8.3.0",
    ...overrides,
  };
}

describe("jiraToProjectItem", () => {
  it("maps a ticket's assignee to the matching team member's GitHub login", () => {
    const item = jiraToProjectItem(ticket({ assigneeId: member.jira_account_id }), teamByJiraId);
    expect(item.assignees).toEqual([{ login: "ibolton336", name: "Ian Bolton", avatarUrl: "" }]);
  });

  it("leaves unassigned tickets with no assignees so they land in Unassigned", () => {
    const item = jiraToProjectItem(ticket({ assigneeId: "" }), teamByJiraId);
    expect(item.assignees).toEqual([]);
  });

  it("leaves off-team assignees unmapped (empty assignees)", () => {
    const item = jiraToProjectItem(ticket({ assigneeId: "someone-not-on-team" }), teamByJiraId);
    expect(item.assignees).toEqual([]);
  });

  it("tags the item as a read-only Jira item and parses the key number", () => {
    const item = jiraToProjectItem(ticket(), teamByJiraId);
    expect(item.source).toBe("jira");
    expect(item.id).toBe("jira:MTA-7642");
    expect(item.issueId).toBe("MTA-7642");
    expect(item.number).toBe(7642);
    expect(item.repo).toBe("");
  });

  it("carries fixVersion and sprint through for filtering/display", () => {
    const item = jiraToProjectItem(ticket(), teamByJiraId, "Sprint 23");
    expect(item.milestone).toBe("MTA 8.3.0");
    expect(item.sprint).toBe("Sprint 23");
  });

  it("labels the item with its issue type in a red hue for vulnerabilities", () => {
    const item = jiraToProjectItem(ticket(), teamByJiraId);
    expect(item.labels).toEqual([{ name: "Vulnerability", color: "da3633" }]);
  });
});

describe("isCve", () => {
  it("is true only for Jira vulnerability items", () => {
    expect(isCve(jiraToProjectItem(ticket(), teamByJiraId))).toBe(true);
    expect(isCve(jiraToProjectItem(ticket({ issueType: "Bug" }), teamByJiraId))).toBe(false);
    expect(isCve(jiraToProjectItem(ticket({ issueType: "Task" }), teamByJiraId))).toBe(false);
  });
});
