import type { ProjectItem } from "../types/project";

interface CardCompactProps {
  item: ProjectItem;
  onClick: () => void;
}

function getInitials(login: string): string {
  return login.slice(0, 2).toUpperCase();
}

export function CardCompact({ item, onClick }: CardCompactProps) {
  const isJira = item.source === "jira";
  const isCve = isJira && (item.issueType ?? "").toLowerCase() === "vulnerability";
  const isBug =
    isCve ||
    item.labels.some((l) => l.name.toLowerCase() === "bug" || l.name.toLowerCase() === "kind/bug");

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderLeft: isBug ? "3px solid var(--accent-red)" : "1px solid var(--border)",
        borderRadius: 6,
        padding: 10,
        cursor: "pointer",
        marginBottom: 6,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          fontWeight: 500,
          lineHeight: 1.4,
          marginBottom: 6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.title}
      </div>

      {item.labels.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {item.labels.map((l) => (
            <span
              key={l.name}
              style={{
                padding: "1px 7px",
                background: `#${l.color}22`,
                color: `#${l.color}`,
                borderRadius: 12,
                fontSize: 10,
                border: `1px solid #${l.color}44`,
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
          {isJira ? (
            <span style={{ color: "var(--accent-blue)" }}>{item.issueId}</span>
          ) : (
            <>
              <span style={{ color: "var(--accent-blue)" }}>{item.repo}</span> · #{item.number}
            </>
          )}
        </div>
        {item.assignees.length > 0 && (
          <div style={{ display: "flex", gap: 2 }}>
            {item.assignees.slice(0, 3).map((a) => (
              <div
                key={a.login}
                title={a.login}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt={a.login} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                ) : (
                  getInitials(a.login)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
