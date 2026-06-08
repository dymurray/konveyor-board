import { Octokit } from "@octokit/rest";

function getClient(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function updateProjectItemStatus(
  token: string,
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string,
): Promise<void> {
  const { graphql } = await import("@octokit/graphql");
  const gql = graphql.defaults({
    headers: { authorization: `token ${token}` },
  });

  await gql(`
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
  `, { projectId, itemId, fieldId, optionId });
}

export async function setAssignees(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  assignees: string[],
): Promise<void> {
  const client = getClient(token);
  await client.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    assignees,
  });
}

export async function addLabels(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[],
): Promise<void> {
  const client = getClient(token);
  await client.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels,
  });
}

export async function removeLabel(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  label: string,
): Promise<void> {
  const client = getClient(token);
  await client.issues.removeLabel({
    owner,
    repo,
    issue_number: issueNumber,
    name: label,
  });
}

export async function fetchRepoLabels(
  token: string,
  owner: string,
  repo: string,
): Promise<{ name: string; color: string }[]> {
  const client = getClient(token);
  const { data } = await client.issues.listLabelsForRepo({
    owner,
    repo,
    per_page: 100,
  });
  return data.map((l) => ({ name: l.name, color: l.color ?? "ededed" }));
}
