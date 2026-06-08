import { graphql } from "@octokit/graphql";
import type { ProjectItem, ProjectColumn } from "../types.ts";
import { transformProjectItems, transformProjectColumns } from "./transform.ts";

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
              }
            }
            content {
              __typename
              ... on Issue {
                id, number, title, body, state, url
                repository { name, owner { login } }
                assignees(first: 10) { nodes { login, avatarUrl } }
                labels(first: 10) { nodes { name, color } }
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

interface FetchProjectResult {
  projectNodeId: string;
  items: ProjectItem[];
  columns: ProjectColumn[];
}

export async function fetchProject(
  token: string,
  org: string,
  projectNumber: number,
): Promise<FetchProjectResult> {
  const gql = graphql.defaults({
    headers: { authorization: `token ${token}` },
  });

  let allItemNodes: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let columns: ProjectColumn[] = [];
  let projectNodeId = "";
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response: any = await gql(PROJECT_QUERY, { // eslint-disable-line @typescript-eslint/no-explicit-any
      org,
      projectNumber,
      cursor,
    });

    const project = response.organization.projectV2;

    if (!projectNodeId) {
      projectNodeId = project.id;
    }

    if (columns.length === 0) {
      columns = transformProjectColumns(project.fields.nodes);
    }

    allItemNodes = allItemNodes.concat(project.items.nodes);
    hasNextPage = project.items.pageInfo.hasNextPage;
    cursor = project.items.pageInfo.endCursor;
  }

  return {
    projectNodeId,
    items: transformProjectItems(allItemNodes),
    columns,
  };
}
