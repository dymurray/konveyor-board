import { useState, useCallback } from "react";

export type SyncPhase = "idle" | "syncing" | "error" | "rate-limited";

export interface SyncState {
  phase: SyncPhase;
  lastSyncedAt: number | null; // epoch ms of the last successful sync
  detail?: string; // e.g. "300 items", a retry countdown, or an error message
}

// Shared per-source sync bookkeeping for the status panel. Each data hook keeps
// one of these and reports transitions as it fetches.
export function useSyncState(initiallySynced = false) {
  const [sync, setSync] = useState<SyncState>({
    phase: "idle",
    lastSyncedAt: initiallySynced ? Date.now() : null,
  });

  const markSyncing = useCallback(() => setSync((s) => ({ ...s, phase: "syncing", detail: undefined })), []);
  const markSynced = useCallback(() => setSync({ phase: "idle", lastSyncedAt: Date.now() }), []);
  const markIdle = useCallback((detail?: string) => setSync({ phase: "idle", lastSyncedAt: null, detail }), []);
  const markError = useCallback((detail?: string) => setSync((s) => ({ ...s, phase: "error", detail })), []);
  const markRateLimited = useCallback((detail?: string) => setSync((s) => ({ ...s, phase: "rate-limited", detail })), []);
  const setDetail = useCallback((detail: string) => setSync((s) => (s.phase === "syncing" ? { ...s, detail } : s)), []);

  return { sync, markSyncing, markSynced, markIdle, markError, markRateLimited, setDetail };
}
