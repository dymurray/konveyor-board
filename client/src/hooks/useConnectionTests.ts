import { useState, useCallback } from "react";
import { normaliseProxyUrl } from "../api/token";
import { verifyGitHubToken, verifyJiraCredentials, type VerifyResult } from "../api/verify";

// Shared "Test connection" state + handlers used by both the initial TokenInput
// screen and the SettingsPanel. Form fields stay owned by the caller and are
// passed in, so this hook only owns the test results and in-flight flags.
export function useConnectionTests() {
  const [githubTest, setGithubTest] = useState<VerifyResult | null>(null);
  const [testingGithub, setTestingGithub] = useState(false);
  const [jiraTest, setJiraTest] = useState<VerifyResult | null>(null);
  const [testingJira, setTestingJira] = useState(false);

  const testGithub = useCallback(async (pat: string) => {
    setTestingGithub(true);
    setGithubTest(null);
    try {
      setGithubTest(await verifyGitHubToken(pat.trim()));
    } finally {
      setTestingGithub(false);
    }
  }, []);

  const testJira = useCallback(async (email: string, apiToken: string, rawProxyUrl: string) => {
    setTestingJira(true);
    setJiraTest(null);
    try {
      const trimmed = rawProxyUrl.trim();
      const target = trimmed ? normaliseProxyUrl(trimmed) : "";
      if (trimmed && !target) {
        setJiraTest({ ok: false, checks: [{ label: "CORS proxy URL", status: "fail", detail: `"${trimmed}" is not a valid URL` }] });
        return;
      }
      setJiraTest(await verifyJiraCredentials(email.trim(), apiToken.trim(), target ?? ""));
    } finally {
      setTestingJira(false);
    }
  }, []);

  return { githubTest, setGithubTest, testingGithub, testGithub, jiraTest, setJiraTest, testingJira, testJira };
}
