import type { Check, VerifyResult } from "../api/verify";

const STATUS_COLOR: Record<Check["status"], string> = {
  pass: "var(--accent-green)",
  warn: "var(--accent-yellow)",
  fail: "var(--accent-red)",
};

const STATUS_ICON: Record<Check["status"], string> = {
  pass: "✓",
  warn: "!",
  fail: "✗",
};

export function TestButton({
  onClick,
  testing,
  disabled,
}: {
  onClick: () => void;
  testing: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={testing || disabled}
      style={{
        marginTop: 8,
        padding: "4px 10px",
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        color: testing || disabled ? "var(--text-muted)" : "var(--text-secondary)",
        fontSize: 11,
      }}
    >
      {testing ? "Testing..." : "Test connection"}
    </button>
  );
}

export function CheckList({ result }: { result: VerifyResult }) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 10px",
        background: "var(--bg-tertiary)",
        border: `1px solid ${result.ok ? "#238636" : "#da3634"}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {result.checks.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 6, fontSize: 11, lineHeight: 1.4 }}>
          <span style={{ color: STATUS_COLOR[c.status] }}>{STATUS_ICON[c.status]}</span>
          <span style={{ color: "var(--text-primary)" }}>
            {c.label}
            {c.detail && <span style={{ color: "var(--text-muted)" }}> - {c.detail}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
