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
  role: string;
}

export interface AuthUser {
  login: string;
  avatarUrl: string;
  name: string;
}
