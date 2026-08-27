import { getOrg, getProjectNumber } from "./config";
import { jiraVerifyIdentity, jiraCountRestricted } from "./jira";

export interface Check {
  label: string;
  status: "pass" | "fail" | "warn";
  detail?: string;
}

export interface VerifyResult {
  ok: boolean;
  checks: Check[];
}

const GITHUB_API = import.meta.env.VITE_GITHUB_API || "https://api.github.com";

// Reads the org and the project, and samples board items to find an Issue whose
// `viewerCanUpdate` reports whether the token can edit issues (labels/assignees)
// without mutating anything. Note this is issue-edit permission, not ProjectV2
// field-write (moving cards), which GitHub does not expose as a viewer flag.
const PROBE_QUERY = `
  query($org: String!, $projectNumber: Int!) {
    organization(login: $org) {
      login
      projectV2(number: $projectNumber) {
        title
        items(first: 20) {
          nodes {
            content {
              ... on Issue {
                viewerCanUpdate
                repository { nameWithOwner }
              }
            }
          }
        }
      }
    }
  }
`;

const CLASSIC_SCOPES = ["repo", "project", "read:org"];

function scopeSatisfied(granted: string[], required: string): boolean {
  if (granted.includes(required)) return true;
  // read:org is implied by the broader admin:org / write:org scopes. `project`
  // (write) is deliberately NOT implied by read:project: read:project is
  // read-only and cannot move cards, so accepting it here would green-light a
  // token that fails every write.
  if (required === "read:org") return granted.some((s) => s === "admin:org" || s === "write:org");
  return false;
}

export async function verifyGitHubToken(pat: string): Promise<VerifyResult> {
  const checks: Check[] = [];
  const org = getOrg();
  const projectNumber = getProjectNumber();

  let userRes: Response;
  try {
    userRes = await fetch(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${pat}`, Accept: "application/json" },
    });
  } catch {
    checks.push({ label: "GitHub reachable", status: "fail", detail: "Network request failed" });
    return { ok: false, checks };
  }

  if (!userRes.ok) {
    checks.push({
      label: "GitHub token",
      status: "fail",
      detail: userRes.status === 401 ? "GitHub rejected the token (401)" : `HTTP ${userRes.status}`,
    });
    return { ok: false, checks };
  }

  let user: { login?: string };
  try {
    user = await userRes.json();
  } catch {
    checks.push({ label: "GitHub token", status: "fail", detail: "GitHub returned a non-JSON response" });
    return { ok: false, checks };
  }
  checks.push({ label: "GitHub token", status: "pass", detail: `Authenticated as ${user.login}` });

  // Classic tokens report their scopes here; fine-grained tokens send nothing,
  // so the GraphQL probe below is the real check for those.
  const scopeHeader = userRes.headers.get("x-oauth-scopes");
  if (scopeHeader) {
    const granted = scopeHeader.split(",").map((s) => s.trim()).filter(Boolean);
    const missing = CLASSIC_SCOPES.filter((s) => !scopeSatisfied(granted, s));
    checks.push(
      missing.length === 0
        ? { label: "Token scopes", status: "pass", detail: granted.join(", ") }
        : { label: "Token scopes", status: "warn", detail: `Missing: ${missing.join(", ")}` },
    );
  }

  let probe: { data?: unknown; errors?: { message: string }[] };
  try {
    const res = await fetch(`${GITHUB_API}/graphql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: PROBE_QUERY, variables: { org, projectNumber } }),
    });
    if (!res.ok) {
      checks.push({ label: `Org access (${org})`, status: "fail", detail: `GraphQL HTTP ${res.status}` });
      return { ok: false, checks };
    }
    probe = await res.json();
  } catch {
    checks.push({ label: `Org access (${org})`, status: "fail", detail: "Network request failed" });
    return { ok: false, checks };
  }

  const data = probe.data as {
    organization?: {
      login: string;
      projectV2?: {
        title: string;
        items: { nodes: { content?: { viewerCanUpdate?: boolean; repository?: { nameWithOwner: string } } }[] };
      } | null;
    } | null;
  } | undefined;

  const orgData = data?.organization;
  if (!orgData) {
    const reason = probe.errors?.[0]?.message ?? "Organization not visible to this token";
    checks.push({ label: `Org access (${org})`, status: "fail", detail: reason });
    return { ok: false, checks };
  }
  checks.push({ label: `Org access (${org})`, status: "pass" });

  const project = orgData.projectV2;
  if (!project) {
    checks.push({
      label: `Project #${projectNumber} access`,
      status: "fail",
      detail: probe.errors?.[0]?.message ?? "Project not found or not readable",
    });
    return { ok: false, checks };
  }
  checks.push({ label: `Project #${projectNumber} access`, status: "pass", detail: project.title });

  const firstIssue = project.items.nodes.find((n) => n.content?.viewerCanUpdate !== undefined);
  if (!firstIssue) {
    checks.push({
      label: "Issue edit access",
      status: "warn",
      detail: "No issue on the board to probe with",
    });
  } else if (firstIssue.content?.viewerCanUpdate) {
    checks.push({ label: "Issue edit access", status: "pass", detail: firstIssue.content.repository?.nameWithOwner });
  } else {
    checks.push({
      label: "Issue edit access",
      status: "fail",
      detail: "Read-only: editing labels and assignees will fail",
    });
  }

  return { ok: !checks.some((c) => c.status === "fail"), checks };
}

export async function verifyJiraCredentials(
  email: string,
  apiToken: string,
  proxyUrl: string,
): Promise<VerifyResult> {
  const checks: Check[] = [];

  // 1. Prove authentication. The board is public, so reading issues is not
  //    evidence of anything; /myself returns an identity only if the
  //    credentials actually reached Jira through the proxy.
  let identity;
  try {
    identity = await jiraVerifyIdentity(email, apiToken, proxyUrl);
  } catch (e) {
    checks.push({ label: "Jira reachable", status: "fail", detail: e instanceof Error ? e.message : "Request failed" });
    return { ok: false, checks };
  }

  if (!identity.ok) {
    checks.push({
      label: "Authenticated",
      status: "fail",
      detail: identity.status === 401
        ? "Rejected (401): credentials are wrong, or the proxy is not forwarding them"
        : `Identity check failed (HTTP ${identity.status})`,
    });
    return { ok: false, checks };
  }
  checks.push({
    label: "Authenticated",
    status: "pass",
    detail: `as ${identity.displayName ?? identity.emailAddress ?? "unknown user"}`,
  });

  // 2. Prove we can see restricted issues - the whole point of authenticating.
  //    Anonymous access returns 0 of these; a real count means the private
  //    tickets the board plans around are actually visible.
  try {
    const restricted = await jiraCountRestricted(email, apiToken, proxyUrl);
    checks.push(
      restricted > 0
        ? { label: "Restricted issues visible", status: "pass", detail: `${restricted} security-restricted issues` }
        : { label: "Restricted issues visible", status: "warn", detail: "Authenticated, but none currently visible to confirm access" },
    );
  } catch (e) {
    checks.push({ label: "Restricted issues visible", status: "warn", detail: e instanceof Error ? e.message : "Count failed" });
  }

  return { ok: !checks.some((c) => c.status === "fail"), checks };
}
