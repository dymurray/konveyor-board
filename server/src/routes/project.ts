import { Router } from "express";
import { requireAuth, getToken } from "../auth/middleware.ts";
import { fetchProject } from "../github/graphql.ts";
import { dashboardConfig } from "../config.ts";
import type { AppCache } from "../cache.ts";

export function projectRouter(cache: AppCache): Router {
  const router = Router();

  router.get("/:id/items", requireAuth, async (req, res) => {
    const projectNumber = parseInt(req.params.id, 10);
    const cacheKey = `project:${projectNumber}:items`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const token = getToken(req);
      const { projectNodeId, items, columns, currentSprint } = await fetchProject(token, dashboardConfig.github.org, projectNumber);
      cache.set(cacheKey, { projectNodeId, items, currentSprint }, dashboardConfig.polling.cacheTtlMs / 1000);
      cache.set(`project:${projectNumber}:fields`, columns, 300);
      res.json({ projectNodeId, items, currentSprint });
    } catch (err) {
      console.error("GET /project/:id/items error:", err);
      res.status(502).json({ error: `GitHub API error: ${String(err)}` });
    }
  });

  router.get("/:id/columns", requireAuth, async (req, res) => {
    const projectNumber = parseInt(req.params.id, 10);
    const cacheKey = `project:${projectNumber}:fields`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const token = getToken(req);
      const { columns } = await fetchProject(token, dashboardConfig.github.org, projectNumber);
      cache.set(cacheKey, columns, 300);
      res.json(columns);
    } catch (err) {
      res.status(502).json({ error: `GitHub API error: ${String(err)}` });
    }
  });

  return router;
}
