import { describe, it, expect } from "vitest";
import { transformJiraIssues } from "../src/jira/transform.ts";

const mockIssues = [
  {
    key: "MTA-1234",
    fields: {
      summary: "Fix analyzer crash on Windows",
      status: { name: "In Progress" },
      priority: { name: "Major" },
      issuetype: { name: "Bug" },
      assignee: { accountId: "70121:f490152e-7b1d-41ce-8280-98f1a81f4f61" },
      updated: "2026-06-07T10:00:00.000+0000",
      created: "2026-06-01T08:00:00.000+0000",
    },
  },
  {
    key: "MTA-5678",
    fields: {
      summary: "Add new rule for Spring migration",
      status: { name: "To Do" },
      priority: { name: "Normal" },
      issuetype: { name: "Story" },
      assignee: null,
      updated: "2026-06-06T14:00:00.000+0000",
      created: "2026-05-20T09:00:00.000+0000",
    },
  },
];

describe("transformJiraIssues", () => {
  it("transforms issues with assignees", () => {
    const tickets = transformJiraIssues(mockIssues, "https://redhat.atlassian.net/browse");
    expect(tickets).toHaveLength(2);
    expect(tickets[0]).toEqual({
      key: "MTA-1234",
      summary: "Fix analyzer crash on Windows",
      status: "In Progress",
      priority: "Major",
      issueType: "Bug",
      assigneeId: "70121:f490152e-7b1d-41ce-8280-98f1a81f4f61",
      url: "https://redhat.atlassian.net/browse/MTA-1234",
      updatedAt: "2026-06-07T10:00:00.000+0000",
      createdAt: "2026-06-01T08:00:00.000+0000",
    });
  });

  it("handles null assignee", () => {
    const tickets = transformJiraIssues(mockIssues, "https://redhat.atlassian.net/browse");
    expect(tickets[1].assigneeId).toBe("");
  });
});
