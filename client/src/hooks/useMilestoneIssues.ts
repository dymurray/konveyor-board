import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import type { ProjectItem } from "../types/project";

export function useMilestoneIssues(milestone: string | undefined, intervalMs: number) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!milestone) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMilestoneIssues(milestone);
      setItems(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [milestone]);

  useEffect(() => {
    void fetchItems();
    const poll = setInterval(() => void fetchItems(), intervalMs);
    return () => clearInterval(poll);
  }, [fetchItems, intervalMs]);

  return { items, loading };
}
