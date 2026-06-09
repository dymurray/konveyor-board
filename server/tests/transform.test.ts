import { describe, it, expect } from "vitest";
import { transformProjectItems, transformProjectColumns } from "../src/github/transform.ts";

const mockGraphQLResponse = {
  title: "Konveyor Planning",
  fields: {
    nodes: [
      {
        __typename: "ProjectV2SingleSelectField",
        id: "field-1",
        name: "Status",
        options: [
          { id: "opt-backlog", name: "Backlog" },
          { id: "opt-inprog", name: "In Progress" },
        ],
      },
    ],
  },
  items: {
    pageInfo: { hasNextPage: false, endCursor: null },
    nodes: [
      {
        id: "item-1",
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldSingleSelectValue",
              field: { name: "Status" },
              name: "In Progress",
              optionId: "opt-inprog",
            },
          ],
        },
        content: {
          __typename: "Issue",
          id: "issue-node-1",
          number: 142,
          title: "Support multi-language analysis",
          body: "Description here",
          state: "OPEN",
          url: "https://github.com/konveyor/analyzer-lsp/issues/142",
          repository: { name: "analyzer-lsp", owner: { login: "konveyor" } },
          assignees: {
            nodes: [{ login: "fabianvf", avatarUrl: "https://avatars.githubusercontent.com/fabianvf" }],
          },
          labels: {
            nodes: [{ name: "enhancement", color: "1f6feb" }],
          },
          milestone: { title: "v7.2.0" },
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-06-01T14:30:00Z",
        },
      },
      {
        id: "item-2",
        fieldValues: { nodes: [] },
        content: {
          __typename: "PullRequest",
          id: "pr-node-1",
          number: 200,
          title: "Some PR",
        },
      },
    ],
  },
};

describe("transformProjectItems", () => {
  it("transforms issues and skips PRs", () => {
    const items = transformProjectItems(mockGraphQLResponse.items.nodes);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: "item-1",
      issueId: "issue-node-1",
      number: 142,
      title: "Support multi-language analysis",
      body: "Description here",
      state: "OPEN",
      url: "https://github.com/konveyor/analyzer-lsp/issues/142",
      repo: "analyzer-lsp",
      repoOwner: "konveyor",
      status: "In Progress",
      statusOptionId: "opt-inprog",
      assignees: [{ login: "fabianvf", avatarUrl: "https://avatars.githubusercontent.com/fabianvf" }],
      labels: [{ name: "enhancement", color: "1f6feb" }],
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-06-01T14:30:00Z",
      milestone: "v7.2.0",
      sprint: "",
    });
  });

  it("handles items with no status field", () => {
    const noStatusNodes = [
      {
        id: "item-3",
        fieldValues: { nodes: [] },
        content: {
          __typename: "Issue",
          id: "issue-3",
          number: 99,
          title: "No status issue",
          body: "",
          state: "OPEN",
          url: "https://github.com/konveyor/hub/issues/99",
          repository: { name: "hub", owner: { login: "konveyor" } },
          assignees: { nodes: [] },
          labels: { nodes: [] },
          milestone: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
    ];
    const items = transformProjectItems(noStatusNodes);
    expect(items[0].status).toBe("");
    expect(items[0].statusOptionId).toBe("");
    expect(items[0].milestone).toBe("");
    expect(items[0].sprint).toBe("");
  });
});

describe("transformProjectColumns", () => {
  it("extracts columns from fields", () => {
    const columns = transformProjectColumns(mockGraphQLResponse.fields.nodes);
    expect(columns).toEqual([
      { id: "field-1", name: "Backlog", optionId: "opt-backlog" },
      { id: "field-1", name: "In Progress", optionId: "opt-inprog" },
    ]);
  });
});
