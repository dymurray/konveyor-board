import { useState } from "react";
import { getJiraCredentials, getJiraProxyUrl, normaliseProxyUrl, setJiraCredentials, setJiraProxyUrl } from "../api/token";
import { DEV_JIRA_PROXY_AVAILABLE } from "../api/jira";
import { useConnectionTests } from "../hooks/useConnectionTests";
import { TestButton, CheckList } from "./ConnectionCheck";

interface TokenInputProps {
  onSubmit: (pat: string) => void;
  error?: string | null;
}

export function TokenInput({ onSubmit, error }: TokenInputProps) {
  const [pat, setPat] = useState("");
  const [showJira, setShowJira] = useState(false);
  const [jiraEmail, setJiraEmail] = useState(() => getJiraCredentials()?.email ?? "");
  const [jiraToken, setJiraToken] = useState(() => getJiraCredentials()?.apiToken ?? "");
  const [proxyUrl, setProxyUrl] = useState(() => getJiraProxyUrl() ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const { githubTest, setGithubTest, testingGithub, testGithub, jiraTest, setJiraTest, testingJira, testJira } = useConnectionTests();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat.trim()) return;
    setSubmitting(true);

    if (jiraEmail.trim() && jiraToken.trim()) {
      setJiraCredentials({ email: jiraEmail.trim(), apiToken: jiraToken.trim() });
    }
    if (proxyUrl.trim()) {
      const normalised = normaliseProxyUrl(proxyUrl.trim());
      if (!normalised) {
        setProxyError(`"${proxyUrl.trim()}" is not a valid URL.`);
        setShowJira(true);
        setSubmitting(false);
        return;
      }
      setJiraProxyUrl(normalised);
    }

    onSubmit(pat.trim());
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px 0" }}>Konveyor Board</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>Enter a GitHub Personal Access Token to connect</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: 400, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
            GitHub PAT
          </label>
          <input
            type="password"
            value={pat}
            onChange={(e) => { setPat(e.target.value); setGithubTest(null); }}
            placeholder="ghp_... or github_pat_..."
            style={inputStyle}
            autoFocus
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Requires <code style={{ background: "var(--bg-tertiary)", padding: "1px 4px", borderRadius: 3 }}>repo</code>,{" "}
            <code style={{ background: "var(--bg-tertiary)", padding: "1px 4px", borderRadius: 3 }}>project</code>, and{" "}
            <code style={{ background: "var(--bg-tertiary)", padding: "1px 4px", borderRadius: 3 }}>read:org</code> scopes.{" "}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#58a6ff" }}
            >
              Create a token
            </a>
          </div>
          <TestButton onClick={() => void testGithub(pat)} testing={testingGithub} disabled={!pat.trim()} />
          {githubTest && <CheckList result={githubTest} />}
        </div>

        {error && (
          <div style={{ padding: "8px 12px", background: "#da363415", border: "1px solid #da3634", borderRadius: 6, color: "#f85149", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowJira(!showJira)}
          style={{
            background: "none",
            border: "none",
            color: "#58a6ff",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
            padding: 0,
          }}
        >
          {showJira ? "Hide" : "Show"} Jira settings (optional)
        </button>

        {showJira && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Optional: connect to Jira for ticket integration. Requires a CORS proxy.
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Jira Email</label>
              <input type="email" value={jiraEmail} onChange={(e) => { setJiraEmail(e.target.value); setJiraTest(null); }} placeholder="you@redhat.com" style={{ ...inputStyle, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Jira API Token</label>
              <input type="password" value={jiraToken} onChange={(e) => { setJiraToken(e.target.value); setJiraTest(null); }} placeholder="Atlassian API token" style={{ ...inputStyle, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>CORS Proxy URL</label>
              <input
                type="text"
                inputMode="url"
                spellCheck={false}
                value={proxyUrl}
                onChange={(e) => { setProxyUrl(e.target.value); setProxyError(null); setJiraTest(null); }}
                placeholder="https://your-proxy.workers.dev"
                style={{ ...inputStyle, fontSize: 13 }}
              />
              {proxyError && (
                <div style={{ fontSize: 11, color: "#f85149", marginTop: 4 }}>{proxyError}</div>
              )}
            </div>
            <div>
              <TestButton
                onClick={() => void testJira(jiraEmail, jiraToken, proxyUrl)}
                testing={testingJira}
                disabled={!(jiraEmail.trim() && jiraToken.trim() && (DEV_JIRA_PROXY_AVAILABLE || proxyUrl.trim()))}
              />
              {jiraTest && <CheckList result={jiraTest} />}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!pat.trim() || submitting}
          style={{
            padding: "10px 24px",
            background: pat.trim() ? "#238636" : "#23863680",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: pat.trim() ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Connecting..." : "Connect"}
        </button>
      </form>
    </div>
  );
}
