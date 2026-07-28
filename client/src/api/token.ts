const PAT_KEY = "github_pat";
const JIRA_KEY = "jira_credentials";
const PROXY_KEY = "jira_proxy_url";

export function getToken(): string | null {
  return localStorage.getItem(PAT_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(PAT_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(PAT_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("No GitHub token configured");
  return {
    Authorization: `token ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export interface JiraCredentials {
  email: string;
  apiToken: string;
}

export function getJiraCredentials(): JiraCredentials | null {
  const raw = localStorage.getItem(JIRA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JiraCredentials;
  } catch {
    return null;
  }
}

export function setJiraCredentials(creds: JiraCredentials): void {
  localStorage.setItem(JIRA_KEY, JSON.stringify(creds));
}

export function clearJiraCredentials(): void {
  localStorage.removeItem(JIRA_KEY);
}

export function getJiraProxyUrl(): string | null {
  return localStorage.getItem(PROXY_KEY);
}

export function setJiraProxyUrl(url: string): void {
  localStorage.setItem(PROXY_KEY, url);
}

export function clearJiraProxyUrl(): void {
  localStorage.removeItem(PROXY_KEY);
}

export function clearAll(): void {
  clearToken();
  clearJiraCredentials();
  clearJiraProxyUrl();
}
