import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { useSyncState } from "./useSyncState";
import type { ProjectItem } from "../types/project";

export function useMilestoneIssues(milestone: string | string[] | undefined, intervalMs: number) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { sync, markSyncing, markSynced, markError } = useSyncState();
  const milestoneKey = Array.isArray(milestone) ? milestone.join(",") : (milestone ?? "");

  const fetchItems = useCallback(async () => {
    if (!milestone || (Array.isArray(milestone) && milestone.length === 0)) {
      setItems([]);
      setLoading(false);
      markSynced();
      return;
    }
    markSyncing();
    try {
      const milestones = Array.isArray(milestone) ? milestone : [milestone];
      const results = await Promise.all(milestones.map(m => api.getMilestoneIssues(m)));
      const seen = new Set<string>();
      const merged: ProjectItem[] = [];
      for (const batch of results) {
        for (const item of batch) {
          if (!seen.has(item.url)) {
            seen.add(item.url);
            merged.push(item);
          }
        }
      }
      setItems(merged);
      markSynced();
    } catch {
      markError("fetch failed");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneKey, markSyncing, markSynced, markError]);

  useEffect(() => {
    void fetchItems();
    const poll = setInterval(() => void fetchItems(), intervalMs);
    return () => clearInterval(poll);
  }, [fetchItems, intervalMs]);

  const refresh = useCallback(async () => {
    await fetchItems();
  }, [fetchItems]);

  return { items, loading, sync, refresh };
}
