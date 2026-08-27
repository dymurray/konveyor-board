import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

function loadJson(filePath: string, fallback: unknown): unknown {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function loadEnvVar(key: string): string | undefined {
  const envPath = resolve(rootDir, ".env");
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, "utf-8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return undefined;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
}

// Dev-only: browser -> /_jiraproxy (same-origin) -> your CORS proxy, server-side,
// so localhost dodges a proxy whose CORS allowlist doesn't include it. Set
// JIRA_PROXY in .env to your proxy URL; without it the route isn't registered
// and the Jira dev path is simply unavailable.
const jiraProxyTarget = loadEnvVar("JIRA_PROXY");

const teamConfig = loadJson(resolve(rootDir, "team-config.json"), { engineers: [] });
const dashboardConfig = loadJson(resolve(rootDir, "dashboard-config.json"), {
  github: { org: "konveyor", projectNumber: 67 },
  polling: { intervalMs: 30000, cacheTtlMs: 60000 },
});

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  define: {
    __TEAM_CONFIG__: JSON.stringify(teamConfig),
    __DASHBOARD_CONFIG__: JSON.stringify(dashboardConfig),
    // Whether the same-origin /_jiraproxy dev route below was registered, so the
    // client only rewrites Jira calls onto it when it actually exists.
    __JIRA_DEV_PROXY__: JSON.stringify(Boolean(jiraProxyTarget)),
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      ...(jiraProxyTarget
        ? {
            "/_jiraproxy": {
              target: jiraProxyTarget,
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/_jiraproxy/, "") || "/",
            },
          }
        : {}),
    },
  },
});
