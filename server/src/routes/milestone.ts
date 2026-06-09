import { Router } from "express";
import { requireAuth, getToken } from "../auth/middleware.ts";
import { searchMilestoneIssues } from "../github/search.ts";
import { dashboardConfig } from "../config.ts";
import type { AppCache } from "../cache.ts";

export function milestoneRouter(cache: AppCache): Router {
  const router = Router();

  router.get("/:milestone/issues", requireAuth, async (req, res) => {
    const milestone = decodeURIComponent(req.params.milestone);
    const cacheKey = `milestone:${milestone}:issues`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const token = getToken(req);
      const items = await searchMilestoneIssues(token, dashboardConfig.github.org, milestone);
      cache.set(cacheKey, items, dashboardConfig.polling.cacheTtlMs / 1000);
      res.json(items);
    } catch (err) {
      console.error("Milestone search error:", err);
      res.status(502).json({ error: `GitHub search error: ${String(err)}` });
    }
  });

  return router;
}
