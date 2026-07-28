import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

function loadJson(filePath: string, fallback: unknown): unknown {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

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
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
