import { Router } from "express";
import { requireAuth } from "../auth/middleware.ts";
import { fetchJiraTickets } from "../jira/client.ts";
import { teamConfig, dashboardConfig } from "../config.ts";
import type { AppCache } from "../cache.ts";

export function jiraRouter(cache: AppCache): Router {
  const router = Router();

  router.get("/tickets", requireAuth, async (_req, res) => {
    const cacheKey = "jira:tickets";
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const accountIds = teamConfig.engineers
        .map((e) => e.jira_account_id)
        .filter((id) => id && id.length > 0);

      const tickets = await fetchJiraTickets(accountIds);
      cache.set(cacheKey, tickets, dashboardConfig.polling.cacheTtlMs / 1000);
      res.json(tickets);
    } catch (err) {
      console.error("JIRA fetch error:", err);
      res.status(502).json({ error: `JIRA API error: ${String(err)}` });
    }
  });

  return router;
}
