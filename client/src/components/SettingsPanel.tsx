import { useState } from "react";
import { api } from "../api/client";
import { invalidateCache } from "../api/cache";
import {
  clearAll,
  clearJiraCredentials,
  clearJiraProxyUrl,
  getJiraCredentials,
  getJiraProxyUrl,
  getToken,
  normaliseProxyUrl,
  setJiraCredentials,
  setJiraProxyUrl,
  setToken,
} from "../api/token";
import { DEV_JIRA_PROXY_AVAILABLE } from "../api/jira";
import { useConnectionTests } from "../hooks/useConnectionTests";
import { TestButton, CheckList } from "./ConnectionCheck";
import type { AuthUser } from "../types/project";

interface SettingsPanelProps {
  user: AuthUser | null;
  onClose: () => void;
  onUserChange: (user: AuthUser) => void;
  onSaved: () => void;
  onSignOut: () => void;
}

// When the app is served behind the Caddy proxy these are baked in at build
// time and the real credentials never reach the browser.
const GITHUB_PROXIED = Boolean(import.meta.env.VITE_GITHUB_API);
const JIRA_PROXIED = Boolean(import.meta.env.VITE_JIRA_PROXY);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 13,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--text-secondary)",
  marginBottom: 4,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "var(--text-secondary)",
  marginBottom: 10,
};

export function SettingsPanel({ user, onClose, onUserChange, onSaved, onSignOut }: SettingsPanelProps) {
  const [pat, setPat] = useState(() => getToken() ?? "");
  const [showPat, setShowPat] = useState(false);
  const [jiraEmail, setJiraEmail] = useState(() => getJiraCredentials()?.email ?? "");
  const [jiraToken, setJiraToken] = useState(() => getJiraCredentials()?.apiToken ?? "");
  const [proxyUrl, setProxyUrl] = useState(() => getJiraProxyUrl() ?? "");
  const { githubTest, setGithubTest, testingGithub, testGithub, jiraTest, setJiraTest, testingJira, testJira } = useConnectionTests();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [hasStoredJira, setHasStoredJira] = useState(
    () => Boolean(getJiraCredentials() || getJiraProxyUrl()),
  );

  const handleDisconnectJira = () => {
    clearJiraCredentials();
    clearJiraProxyUrl();
    setJiraEmail("");
    setJiraToken("");
    setProxyUrl("");
    setJiraTest(null);
    setHasStoredJira(false);
    onSaved();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const trimmedPat = pat.trim();
    if (!trimmedPat) {
      setError("A GitHub token is required.");
      return;
    }

    // Validate the proxy URL up front, before anything is persisted, so an
    // invalid value can't leave the token and Jira credentials half-saved with
    // no cache refresh and no "saved" confirmation.
    const trimmedProxy = proxyUrl.trim();
    let normalisedProxy: string | null = null;
    if (trimmedProxy) {
      normalisedProxy = normaliseProxyUrl(trimmedProxy);
      if (!normalisedProxy) {
        setError(`"${trimmedProxy}" is not a valid URL.`);
        return;
      }
    }

    setSaving(true);
    try {
      // Validate before storing, so a bad paste does not lock the user out.
      if (trimmedPat !== getToken()) {
        const me = await api.validateToken(trimmedPat);
        setToken(trimmedPat);
        onUserChange(me);
      }

      // Only ever write. A blank field means "nothing new to save" — never
      // "delete what is stored", or a panel that renders empty for any reason
      // silently destroys working credentials on Save.
      if (jiraEmail.trim() && jiraToken.trim()) {
        setJiraCredentials({ email: jiraEmail.trim(), apiToken: jiraToken.trim() });
        setHasStoredJira(true);
      }

      if (normalisedProxy) {
        setProxyUrl(normalisedProxy);
        setJiraProxyUrl(normalisedProxy);
        setHasStoredJira(true);
      }

      invalidateCache("");
      setSaved(true);
      onSaved();
    } catch (e) {
      const status = (e as { status?: number }).status;
      setError(
        status === 401
          ? "GitHub rejected that token. Check it has repo, project and read:org scopes."
          : status
            ? `Could not validate the token: GitHub returned HTTP ${status}.`
            : "Could not reach GitHub to validate the token. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    // Two-step: this wipes every stored credential and there is no undo.
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    clearAll();
    onSignOut();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 490 }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 420,
          maxWidth: "100vw",
          height: "100vh",
          background: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          zIndex: 500,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Settings</div>
            {user && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                Signed in as {user.login}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 20, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={sectionTitleStyle}>GitHub</div>
            <label style={labelStyle}>Personal Access Token</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showPat ? "text" : "password"}
                value={pat}
                onChange={(e) => { setPat(e.target.value); setGithubTest(null); }}
                placeholder="ghp_... or github_pat_..."
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPat(!showPat)}
                style={{
                  padding: "0 10px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {showPat ? "Hide" : "Show"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
              {GITHUB_PROXIED ? (
                <>Requests go through the server proxy, which supplies its own token. This value is only used to unlock the UI.</>
              ) : (
                <>
                  Needs <code>repo</code>, <code>project</code> and <code>read:org</code> scopes.{" "}
                  <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>
                    Create a token
                  </a>
                </>
              )}
            </div>
            <TestButton onClick={() => void testGithub(pat)} testing={testingGithub} disabled={!pat.trim()} />
            {githubTest && <CheckList result={githubTest} />}
          </div>

          <div>
            <div style={sectionTitleStyle}>Jira (optional)</div>
            {JIRA_PROXIED ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Jira credentials are configured on the server and cannot be changed here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={jiraEmail} onChange={(e) => { setJiraEmail(e.target.value); setJiraTest(null); }} placeholder="you@redhat.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>API Token</label>
                  <input type="password" value={jiraToken} onChange={(e) => { setJiraToken(e.target.value); setJiraTest(null); }} placeholder="Atlassian API token" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CORS Proxy URL</label>
                  <input
                    type="text"
                    inputMode="url"
                    spellCheck={false}
                    value={proxyUrl}
                    onChange={(e) => { setProxyUrl(e.target.value); setJiraTest(null); }}
                    placeholder="https://your-proxy.workers.dev"
                    style={inputStyle}
                  />
                </div>
                {hasStoredJira && (
                  <button
                    type="button"
                    onClick={handleDisconnectJira}
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "none",
                      color: "var(--accent-red)",
                      fontSize: 11,
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Disconnect Jira
                  </button>
                )}
              </div>
            )}
            <TestButton
              onClick={() => void testJira(jiraEmail, jiraToken, proxyUrl)}
              testing={testingJira}
              disabled={!JIRA_PROXIED && !(jiraEmail.trim() && jiraToken.trim() && (DEV_JIRA_PROXY_AVAILABLE || proxyUrl.trim()))}
            />
            {jiraTest && <CheckList result={jiraTest} />}
          </div>

          {error && (
            <div style={{ padding: "8px 12px", background: "#da363415", border: "1px solid #da3634", borderRadius: 6, color: "var(--accent-red)", fontSize: 12 }}>
              {error}
            </div>
          )}
          {saved && !error && (
            <div style={{ padding: "8px 12px", background: "#23863615", border: "1px solid #238636", borderRadius: 6, color: "var(--accent-green)", fontSize: 12 }}>
              Settings saved. Data reloaded.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "9px 16px",
              background: saving ? "#23863680" : "#238636",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>

        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "8px 16px",
              background: confirmSignOut ? "#da363420" : "transparent",
              border: `1px solid ${confirmSignOut ? "#da3634" : "var(--border)"}`,
              borderRadius: 6,
              color: "var(--accent-red)",
              fontSize: 13,
            }}
          >
            {confirmSignOut ? "Click again to erase - this cannot be undone" : "Sign out and clear stored credentials"}
          </button>
          {confirmSignOut && (
            <button
              onClick={() => setConfirmSignOut(false)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "6px 16px",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: 11,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
}
