import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "../api/client";
import { onProjectFetchProgress } from "../api/github-graphql";
import { invalidateCache } from "../api/cache";
import { useSyncState } from "./useSyncState";
import type { ProjectItem } from "../types/project";

function isRateLimit(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Match only genuine rate-limit signals. GitHub's primary/secondary limits
  // always carry "rate limit" text (REST body) or a RATE_LIMITED GraphQL error,
  // plus 429. A bare 403 is overwhelmingly a permission/SSO/forbidden error, not
  // a rate limit, so keying off it wrongly triggered a 60s backoff that hid the
  // real auth failure.
  return /rate.?limit|\b429\b/i.test(msg);
}

// After a rate-limit, wait this long before polling again instead of hammering
// GitHub every intervalMs (the secondary limit punishes bursts).
const RATE_LIMIT_COOLDOWN_MS = 60_000;

export function useProjectItems(projectId: number, intervalMs: number) {
  const initial = useMemo(() => api.getCachedItems(projectId), [projectId]);

  const [items, setItems] = useState<ProjectItem[]>(initial?.items ?? []);
  const [projectNodeId, setProjectNodeId] = useState<string>(initial?.projectNodeId ?? "");
  const [currentSprint, setCurrentSprint] = useState<string | null>(initial?.currentSprint ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const { sync, markSyncing, markSynced, markError, markRateLimited, setDetail } = useSyncState(!!initial);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffUntilRef = useRef(0);

  const fetchItems = useCallback(async () => {
    markSyncing();
    try {
      const data = await api.getItems(projectId);
      setItems(data.items);
      setProjectNodeId(data.projectNodeId);
      setCurrentSprint(data.currentSprint);
      setError(null);
      backoffUntilRef.current = 0;
      markSynced();
    } catch (err) {
      if (isRateLimit(err)) {
        backoffUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        setError("GitHub rate limit hit. Showing the last loaded board; retrying shortly.");
        markRateLimited(`retry in ${Math.round(RATE_LIMIT_COOLDOWN_MS / 1000)}s`);
      } else {
        setError(String(err));
        markError("fetch failed");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, markSyncing, markSynced, markError, markRateLimited]);

  useEffect(() => {
    return onProjectFetchProgress((itemsLoaded, done) => {
      if (!done) setDetail(`${itemsLoaded} items`);
    });
  }, [setDetail]);

  useEffect(() => {
    void fetchItems();

    // Skip the tick while backing off from a rate limit; stale data stays up.
    const poll = setInterval(() => {
      if (Date.now() < backoffUntilRef.current) return;
      void fetchItems();
    }, intervalMs);
    timerRef.current = poll;

    const countdown = setInterval(() => {
      // During a rate-limit cooldown the poll ticks are skipped, so count down
      // the actual backoff remaining instead of a phantom refresh interval.
      const backoffLeft = backoffUntilRef.current - Date.now();
      if (backoffLeft > 0) {
        setSecondsUntilRefresh(Math.ceil(backoffLeft / 1000));
        return;
      }
      setSecondsUntilRefresh((prev) => (prev <= 1 ? Math.round(intervalMs / 1000) : prev - 1));
    }, 1000);

    setSecondsUntilRefresh(Math.round(intervalMs / 1000));

    return () => {
      clearInterval(poll);
      clearInterval(countdown);
    };
  }, [fetchItems, intervalMs]);

  const refresh = useCallback(async () => {
    backoffUntilRef.current = 0; // an explicit refresh overrides the cooldown
    // Drop the cached snapshot so an explicit Refresh actually re-fetches
    // instead of short-circuiting on a board that is younger than the TTL.
    invalidateCache("project:");
    setSecondsUntilRefresh(Math.round(intervalMs / 1000));
    await fetchItems();
  }, [fetchItems, intervalMs]);

  return { items, setItems, projectNodeId, currentSprint, loading, error, sync, secondsUntilRefresh, refresh };
}
