import type { ProjectItem, ProjectColumn } from "../types/project";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function transformProjectItems(nodes: any[]): ProjectItem[] {
  const items: ProjectItem[] = [];

  for (const node of nodes) {
    const content = node.content;
    if (!content || content.__typename === "PullRequest" || !content.repository) {
      continue;
    }

    const statusField = node.fieldValues?.nodes?.find(
      (fv: any) => fv.__typename === "ProjectV2ItemFieldSingleSelectValue" && fv.field?.name === "Status",
    );

    const sprintField = node.fieldValues?.nodes?.find(
      (fv: any) => fv.__typename === "ProjectV2ItemFieldIterationValue" && fv.field?.name === "Sprint",
    );

    items.push({
      id: node.id,
      issueId: content.id,
      number: content.number,
      title: content.title,
      body: content.body ?? "",
      state: content.state,
      url: content.url,
      repo: content.repository.name,
      repoOwner: content.repository.owner.login,
      status: statusField?.name ?? "",
      statusOptionId: statusField?.optionId ?? "",
      assignees: (content.assignees?.nodes ?? []).map((a: any) => ({
        login: a.login,
        avatarUrl: a.avatarUrl,
      })),
      labels: (content.labels?.nodes ?? []).map((l: any) => ({
        name: l.name,
        color: l.color,
      })),
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      milestone: content.milestone?.title ?? "",
      sprint: sprintField?.title ?? "",
    });
  }

  return items;
}

export function transformProjectColumns(fieldNodes: any[]): ProjectColumn[] {
  const columns: ProjectColumn[] = [];

  for (const field of fieldNodes) {
    if (field.__typename === "ProjectV2SingleSelectField" && field.name === "Status") {
      for (const option of field.options) {
        columns.push({
          id: field.id,
          name: option.name,
          optionId: option.id,
        });
      }
    }
  }

  return columns;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
