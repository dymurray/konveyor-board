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
  directory: string;
  github: string;
  jira_account_id: string;
  jira_display_names: string[];
  role: string;
}

export interface TeamConfig {
  team_name: string;
  report_title: string;
  products: {
    key: string;
    name: string;
    jira_prefixes: string[];
    repos: string[];
  }[];
  engineers: TeamMember[];
}

export interface DashboardConfig {
  github: {
    org: string;
    projectNumber: number;
  };
  polling: {
    intervalMs: number;
    cacheTtlMs: number;
  };
  oauth: {
    callbackUrl: string;
  };
}
