import { Router } from "express";
import { requireAuth } from "../auth/middleware.ts";
import { fetchJiraByFixVersion, fetchAllJiraTickets } from "../jira/client.ts";
import { dashboardConfig } from "../config.ts";
import type { AppCache } from "../cache.ts";

export function jiraRouter(cache: AppCache): Router {
  const router = Router();

  router.get("/tickets", requireAuth, async (req, res) => {
    const fixVersion = req.query.fixVersion as string | undefined;
    const sprint = req.query.sprint as string | undefined;
    const cacheKey = fixVersion
      ? `jira:tickets:${fixVersion}:${sprint ?? "all"}`
      : `jira:tickets:all:${sprint ?? "all"}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const tickets = fixVersion
        ? await fetchJiraByFixVersion(fixVersion, sprint)
        : await fetchAllJiraTickets(sprint);
      cache.set(cacheKey, tickets, dashboardConfig.polling.cacheTtlMs / 1000);
      res.json(tickets);
    } catch (err) {
      console.error("JIRA fetch error:", err);
      res.status(502).json({ error: `JIRA API error: ${String(err)}` });
    }
  });

  return router;
}
