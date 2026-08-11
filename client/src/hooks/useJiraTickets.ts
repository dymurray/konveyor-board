import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import type { JiraTicket } from "../types/project";

export function useJiraTickets(intervalMs: number, fixVersion?: string | string[], sprint?: string) {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const fixVersionKey = Array.isArray(fixVersion) ? fixVersion.join(",") : (fixVersion ?? "");

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.getJiraTickets(fixVersion, sprint);
      setTickets(data);
    } catch {
      // JIRA may not be configured — fail silently
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixVersionKey, sprint]);

  useEffect(() => {
    void fetchTickets();
    const poll = setInterval(() => void fetchTickets(), intervalMs);
    return () => clearInterval(poll);
  }, [fetchTickets, intervalMs]);

  const refresh = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, refresh };
}
