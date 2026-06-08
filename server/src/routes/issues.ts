import { Router } from "express";
import { requireAuth, getToken } from "../auth/middleware.ts";
import { updateProjectItemStatus, setAssignees, addLabels, removeLabel, fetchRepoLabels } from "../github/rest.ts";
import type { AppCache } from "../cache.ts";

export function issuesRouter(cache: AppCache): Router {
  const router = Router();

  router.patch("/project/:id/items/:itemId/status", requireAuth, async (req, res) => {
    const { fieldId, optionId, projectId } = req.body as {
      fieldId: string;
      optionId: string;
      projectId: string;
    };

    try {
      const token = getToken(req);
      await updateProjectItemStatus(token, projectId, req.params.itemId, fieldId, optionId);
      cache.invalidate(`project:${req.params.id}:items`);
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: `Failed to update status: ${String(err)}` });
    }
  });

  router.patch("/repos/:owner/:repo/issues/:number/assignees", requireAuth, async (req, res) => {
    const { assignees } = req.body as { assignees: string[] };

    try {
      const token = getToken(req);
      await setAssignees(token, req.params.owner, req.params.repo, parseInt(req.params.number, 10), assignees);
      cache.invalidateByPrefix("project:");
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: `Failed to update assignees: ${String(err)}` });
    }
  });

  router.post("/repos/:owner/:repo/issues/:number/labels", requireAuth, async (req, res) => {
    const { labels } = req.body as { labels: string[] };

    try {
      const token = getToken(req);
      await addLabels(token, req.params.owner, req.params.repo, parseInt(req.params.number, 10), labels);
      cache.invalidateByPrefix("project:");
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: `Failed to add labels: ${String(err)}` });
    }
  });

  router.delete("/repos/:owner/:repo/issues/:number/labels/:name", requireAuth, async (req, res) => {
    try {
      const token = getToken(req);
      await removeLabel(
        token,
        req.params.owner,
        req.params.repo,
        parseInt(req.params.number, 10),
        req.params.name,
      );
      cache.invalidateByPrefix("project:");
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: `Failed to remove label: ${String(err)}` });
    }
  });

  router.get("/repos/:owner/:repo/labels", requireAuth, async (req, res) => {
    const cacheKey = `repo:${req.params.owner}/${req.params.repo}:labels`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const token = getToken(req);
      const labels = await fetchRepoLabels(token, req.params.owner, req.params.repo);
      cache.set(cacheKey, labels, 300);
      res.json(labels);
    } catch (err) {
      res.status(502).json({ error: `Failed to fetch labels: ${String(err)}` });
    }
  });

  return router;
}
