import { useState, useEffect } from "react";
import type { SyncState, SyncPhase } from "../hooks/useSyncState";

const PHASE_COLOR: Record<SyncPhase, string> = {
  idle: "var(--accent-green)",
  syncing: "var(--accent-blue)",
  error: "var(--accent-red)",
  "rate-limited": "var(--accent-yellow)",
};

function relativeTime(ts: number | null, now: number): string {
  if (!ts) return "not yet";
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function statusText(sync: SyncState, now: number): string {
  switch (sync.phase) {
    case "syncing":
      return sync.detail ? `loading ${sync.detail}...` : "syncing...";
    case "rate-limited":
      return sync.detail ? `rate-limited, ${sync.detail}` : "rate-limited";
    case "error":
      return sync.detail ?? "error";
    default:
      // idle with a detail means "not configured" (never synced); otherwise
      // it's a normal successful sync.
      return sync.detail ?? `updated ${relativeTime(sync.lastSyncedAt, now)}`;
  }
}

export interface SyncSource {
  label: string;
  sync: SyncState;
}

export function SyncStatus({ sources }: { sources: SyncSource[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.5 }}>
        Sync
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sources.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span
              className={s.sync.phase === "syncing" ? "sync-pulse" : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                // idle + never-synced + detail = "not configured": mute it so a
                // green dot never implies a source that isn't set up.
                background:
                  s.sync.phase === "idle" && s.sync.lastSyncedAt === null && s.sync.detail
                    ? "var(--text-muted)"
                    : PHASE_COLOR[s.sync.phase],
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--text-secondary)", minWidth: 82 }}>{s.label}</span>
            <span style={{ color: "var(--text-muted)" }}>{statusText(s.sync, now)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
