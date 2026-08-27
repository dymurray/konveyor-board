import type { JiraTicket } from "../types/project";
import { getJiraCredentials, getJiraProxyUrl, normaliseProxyUrl } from "./token";

const JIRA_BASE = import.meta.env.VITE_JIRA_URL || "https://redhat.atlassian.net";
const JIRA_BROWSE = `${JIRA_BASE}/browse`;
const JIRA_PROXY = import.meta.env.VITE_JIRA_PROXY as string | undefined;
const JIRA_PROJECT = "MTA";

// In `vite dev` the worker's CORS allowlist rejects localhost, so browser calls
// to it are blocked. The dev server proxies /_jiraproxy -> the worker
// server-side (see vite.config.ts), making the call same-origin. That route only
// exists when JIRA_PROXY is set in the repo-root .env; __JIRA_DEV_PROXY__ is the
// build-time flag for whether it was registered. Without it (or in a production
// build) we fall back to the stored proxy URL unchanged, rather than rewriting
// every call onto a route that would 404.
declare const __JIRA_DEV_PROXY__: boolean;
const DEV_PROXY_PATH = "/_jiraproxy";
const DEV_JIRA_PROXY_REGISTERED =
  typeof __JIRA_DEV_PROXY__ !== "undefined" ? __JIRA_DEV_PROXY__ : false;

// True only when the same-origin dev proxy is actually available, so the UI can
// let a test run with a blank proxy field; otherwise a proxy URL is required.
export const DEV_JIRA_PROXY_AVAILABLE = import.meta.env.DEV && DEV_JIRA_PROXY_REGISTERED;

function resolveProxyTarget(stored: string | null): string | null {
  if (DEV_JIRA_PROXY_AVAILABLE) return DEV_PROXY_PATH;
  if (!stored) return stored;
  // Normalise on the read path too: a value stored before normaliseProxyUrl
  // existed (e.g. a bare "my-proxy.workers.dev" with no scheme) would otherwise
  // be handed to fetch() and resolved relative to the app origin. Fall back to
  // the raw value only if it cannot be parsed at all.
  return normaliseProxyUrl(stored) ?? stored;
}

// Jira counts as configured when a build-time proxy is baked in, or the user
// has stored credentials plus a way to reach Jira (a proxy URL, or the dev
// proxy in `vite dev`). Used to keep the sync panel from showing a green
// "updated" for a Jira that was never set up.
export function isJiraConfigured(): boolean {
  if (JIRA_PROXY) return true;
  if (!getJiraCredentials()) return false;
  return DEV_JIRA_PROXY_AVAILABLE || Boolean(getJiraProxyUrl());
}

function getJiraAuthHeader(email: string, apiToken: string): string {
  return "Basic " + btoa(`${email}:${apiToken}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformJiraIssues(issues: any[]): JiraTicket[] {
  return issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? "Unknown",
    priority: issue.fields.priority?.name ?? "None",
    issueType: issue.fields.issuetype?.name ?? "Unknown",
    assigneeId: issue.fields.assignee?.accountId ?? "",
    url: `${JIRA_BROWSE}/${issue.key}`,
    updatedAt: issue.fields.updated,
    createdAt: issue.fields.created,
    fixVersion: issue.fields.fixVersions?.[0]?.name ?? "",
  }));
}

const JIRA_FIELDS = ["summary", "status", "priority", "issuetype", "assignee", "updated", "created", "fixVersions"];

async function jiraSearch(jql: string): Promise<JiraTicket[]> {
  const body = JSON.stringify({
    jql,
    maxResults: 200,
    fields: JIRA_FIELDS,
  });

  const creds = getJiraCredentials();
  // Without the build-time proxy, browser calls need stored creds and a proxy
  // target (or the same-origin dev proxy). Missing config is a no-op, not an error.
  if (!JIRA_PROXY && (!creds || !resolveProxyTarget(getJiraProxyUrl()))) return [];

  const res = await jiraProxyRequest({
    method: "POST",
    path: "/rest/api/3/search/jql",
    body,
    email: creds?.email ?? "",
    apiToken: creds?.apiToken ?? "",
    proxyUrl: getJiraProxyUrl() ?? "",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA API error ${res.status}: ${text}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as { issues?: any[] };
  // A genuinely empty result still returns `issues: []`; a 200 with no issues
  // array at all is a malformed/interstitial response from the proxy. Throw so
  // useJiraTickets' catch keeps the last-known tickets instead of silently
  // blanking every Jira card and flipping the sync dot to a green "updated".
  if (!Array.isArray(data.issues)) throw new Error("Jira search response had no issues array");
  return transformJiraIssues(data.issues);
}

export async function fetchJiraByFixVersion(fixVersion: string, sprint?: string): Promise<JiraTicket[]> {
  let condition = `fixVersion = "${fixVersion}"`;
  if (sprint) condition = `(${condition} OR sprint = "${sprint}")`;
  const jql = `project = "${JIRA_PROJECT}" AND ${condition} AND resolution is EMPTY AND status not in ("Verified", "Closed") ORDER BY updated DESC`;
  return jiraSearch(jql);
}

export async function fetchJiraByFixVersions(fixVersions: string[], sprint?: string): Promise<JiraTicket[]> {
  if (fixVersions.length === 0) return [];
  const quoted = fixVersions.map(v => `"${v}"`).join(", ");
  let condition = `fixVersion IN (${quoted})`;
  if (sprint) condition = `(${condition} OR sprint = "${sprint}")`;
  const jql = `project = "${JIRA_PROJECT}" AND ${condition} AND resolution is EMPTY AND status not in ("Verified", "Closed") ORDER BY updated DESC`;
  return jiraSearch(jql);
}

export async function fetchAllJiraTickets(): Promise<JiraTicket[]> {
  const jql = `project = "${JIRA_PROJECT}" AND resolution is EMPTY AND status not in ("Verified", "Closed") ORDER BY updated DESC`;
  return jiraSearch(jql);
}

interface JiraProxyReq {
  method: "GET" | "POST";
  path: string;
  body?: string;
  email: string;
  apiToken: string;
  proxyUrl: string;
}

// Single place that knows how to reach Jira: through a build-time proxy that
// injects auth (Caddy), or through a user-configured CORS proxy that forwards
// the caller's Basic auth via X-Target-Url (Cloudflare worker). In `vite dev`
// resolveProxyTarget rewrites the latter to the same-origin /_jiraproxy route.
async function jiraProxyRequest({ method, path, body, email, apiToken, proxyUrl }: JiraProxyReq): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";

  if (JIRA_PROXY) {
    return fetch(`${JIRA_PROXY}${path}`, { method, headers, body });
  }

  if (!email || !apiToken) throw new Error("Enter a Jira email and API token first");
  const target = resolveProxyTarget(proxyUrl);
  if (!target) throw new Error("A CORS proxy URL is required to reach Jira from the browser");
  headers.Authorization = getJiraAuthHeader(email, apiToken);
  headers["X-Target-Url"] = `${JIRA_BASE}${path}`;
  return fetch(target, { method, headers, body });
}

export interface JiraIdentity {
  ok: boolean;
  status: number;
  displayName?: string;
  emailAddress?: string;
}

// The real authentication check. Public MTA data is readable anonymously, so
// "can I see issues" proves nothing; /myself returns an identity only when the
// credentials actually reached Jira (401 otherwise).
export async function jiraVerifyIdentity(email: string, apiToken: string, proxyUrl: string): Promise<JiraIdentity> {
  const res = await jiraProxyRequest({ method: "GET", path: "/rest/api/3/myself", email, apiToken, proxyUrl });
  if (!res.ok) return { ok: false, status: res.status };
  const d = (await res.json()) as { displayName?: string; emailAddress?: string };
  return { ok: true, status: res.status, displayName: d.displayName, emailAddress: d.emailAddress };
}

// Count of security-restricted issues (level is not EMPTY). Anonymous callers
// see 0 of these; a non-zero count is proof the session can actually read the
// private issues the board exists to plan around.
export async function jiraCountRestricted(email: string, apiToken: string, proxyUrl: string): Promise<number> {
  const res = await jiraProxyRequest({
    method: "POST",
    path: "/rest/api/3/search/approximate-count",
    body: JSON.stringify({ jql: `project = "${JIRA_PROJECT}" AND level is not EMPTY` }),
    email,
    apiToken,
    proxyUrl,
  });
  if (!res.ok) throw new Error(`Jira count error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = (await res.json()) as { count?: number };
  return d.count ?? 0;
}
