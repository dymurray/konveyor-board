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
    Authorization: `Bearer ${token}`,
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

/**
 * Accepts what people actually paste - a bare host like
 * "my-proxy.workers.dev" - instead of rejecting it. Returns null if the value
 * cannot be read as a URL at all.
 */
export function normaliseProxyUrl(raw: string): string | null {
  const isLocal = /^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(raw);
  const withScheme = /^https?:\/\//i.test(raw)
    ? raw
    : `${isLocal ? "http" : "https"}://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
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
