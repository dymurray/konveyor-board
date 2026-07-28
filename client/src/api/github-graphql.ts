import type { ProjectItem, ProjectColumn } from "../types/project";
import { getAuthHeaders } from "./token";
import { transformProjectItems, transformProjectColumns } from "./transform";
import { getCached, setCache } from "./cache";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const CACHE_TTL = 60_000;

const PROJECT_QUERY = `
  query($org: String!, $projectNumber: Int!, $cursor: String) {
    organization(login: $org) {
      projectV2(number: $projectNumber) {
        id
        title
        fields(first: 20) {
          nodes {
            __typename
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id, name }
            }
            ... on ProjectV2IterationField {
              id
              name
              configuration {
                iterations { id, title, startDate, duration }
              }
            }
          }
        }
        items(first: 100, after: $cursor) {
          pageInfo { hasNextPage, endCursor }
          nodes {
            id
            fieldValues(first: 10) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field { ... on ProjectV2SingleSelectField { name } }
                  name
                  optionId
                }
                ... on ProjectV2ItemFieldIterationValue {
                  field { ... on ProjectV2IterationField { name } }
                  title
                  startDate
                  duration
                  iterationId
                }
              }
            }
            content {
              __typename
              ... on Issue {
                id, number, title, body, state, url
                repository { name, owner { login } }
                assignees(first: 10) { nodes { login, avatarUrl } }
                labels(first: 10) { nodes { name, color } }
                milestone { title }
                createdAt, updatedAt
              }
              ... on PullRequest {
                id, number, title
              }
            }
          }
        }
      }
    }
  }
`;

export interface FetchProjectResult {
  projectNodeId: string;
  items: ProjectItem[];
  columns: ProjectColumn[];
  currentSprint: string | null;
}

export async function fetchProject(
  org: string,
  projectNumber: number,
): Promise<FetchProjectResult> {
  const cacheKey = `project:${org}:${projectNumber}`;
  const cached = getCached<FetchProjectResult>(cacheKey);
  if (cached) return cached;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allItemNodes: any[] = [];
  let columns: ProjectColumn[] = [];
  let projectNodeId = "";
  let currentSprint: string | null = null;
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query: PROJECT_QUERY,
        variables: { org, projectNumber, cursor },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub GraphQL error ${res.status}: ${text}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    if (json.errors?.length) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const org_data = json.data?.organization;
    if (!org_data) {
      throw new Error("Cannot access the organization. Ensure your token has the read:org scope and access to the konveyor org.");
    }

    const project = org_data.projectV2;
    if (!project) {
      throw new Error("Cannot access ProjectV2 #" + projectNumber + ". Ensure your token has the project scope (classic PAT) or Organization Projects read permission (fine-grained PAT).");
    }

    if (!projectNodeId) {
      projectNodeId = project.id;
    }

    if (columns.length === 0) {
      columns = transformProjectColumns(project.fields.nodes);

      if (!currentSprint) {
        const now = new Date();
        for (const field of project.fields.nodes) {
          if (field.__typename === "ProjectV2IterationField" && field.name === "Sprint") {
            for (const iter of field.configuration.iterations) {
              const start = new Date(iter.startDate);
              const end = new Date(start);
              end.setDate(end.getDate() + iter.duration);
              if (now >= start && now < end) {
                currentSprint = iter.title;
                break;
              }
            }
          }
        }
      }
    }

    allItemNodes = allItemNodes.concat(project.items.nodes);
    hasNextPage = project.items.pageInfo.hasNextPage;
    cursor = project.items.pageInfo.endCursor;
  }

  const result: FetchProjectResult = {
    projectNodeId,
    items: transformProjectItems(allItemNodes),
    columns,
    currentSprint,
  };

  setCache(cacheKey, result, CACHE_TTL);
  return result;
}

export async function updateProjectItemStatus(
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string,
): Promise<void> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      query: `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: { singleSelectOptionId: $optionId }
          }) {
            projectV2Item { id }
          }
        }
      `,
      variables: { projectId, itemId, fieldId, optionId },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GraphQL mutation error ${res.status}: ${text}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  if (json.errors?.length) {
    throw new Error(`GraphQL mutation errors: ${JSON.stringify(json.errors)}`);
  }
}
