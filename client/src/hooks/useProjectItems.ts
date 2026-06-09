import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/client";
import type { ProjectItem } from "../types/project";

export function useProjectItems(projectId: number, intervalMs: number) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [projectNodeId, setProjectNodeId] = useState<string>("");
  const [currentSprint, setCurrentSprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.getItems(projectId);
      setItems(data.items);
      setProjectNodeId(data.projectNodeId);
      setCurrentSprint(data.currentSprint);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchItems();
    const poll = setInterval(() => void fetchItems(), intervalMs);
    timerRef.current = poll;

    const countdown = setInterval(() => {
      setSecondsUntilRefresh((prev) => (prev <= 1 ? Math.round(intervalMs / 1000) : prev - 1));
    }, 1000);

    setSecondsUntilRefresh(Math.round(intervalMs / 1000));

    return () => {
      clearInterval(poll);
      clearInterval(countdown);
    };
  }, [fetchItems, intervalMs]);

  const refresh = useCallback(async () => {
    setSecondsUntilRefresh(Math.round(intervalMs / 1000));
    await fetchItems();
  }, [fetchItems, intervalMs]);

  return { items, setItems, projectNodeId, currentSprint, loading, error, secondsUntilRefresh, refresh };
}
