export interface ProjectItem {
  id: string;
  issueId: string;
  number: number;
  title: string;
  body: string;
  state: "OPEN" | "CLOSED";
  url: string;
  repo: string;
  repoOwner: string;
  status: string;
  statusOptionId: string;
  assignees: Assignee[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
  milestone: string;
}

export interface Assignee {
  login: string;
  avatarUrl: string;
  name?: string;
}

export interface Label {
  name: string;
  color: string;
}

export interface ProjectColumn {
  id: string;
  name: string;
  optionId: string;
}

export interface TeamMember {
  name: string;
  github: string;
  jira_account_id: string;
  role: string;
}

export interface AuthUser {
  login: string;
  avatarUrl: string;
  name: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  priority: string;
  issueType: string;
  assigneeId: string;
  url: string;
  updatedAt: string;
  createdAt: string;
  fixVersion: string;
}
