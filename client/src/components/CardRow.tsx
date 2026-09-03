import type { ProjectItem } from "../types/project";

interface CardRowProps {
  item: ProjectItem;
  selected: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  checked: boolean;
}

export function CardRow({ item, selected, onSelect, onToggleCheck, checked }: CardRowProps) {
  return (
    <tr
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: selected ? "var(--bg-tertiary)" : "transparent",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <td style={{ padding: "8px 12px", width: 32 }} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={checked} onChange={onToggleCheck} style={{ accentColor: "var(--accent-blue)" }} />
      </td>
      <td style={{ padding: "8px 0", fontSize: 13, color: "var(--text-primary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.title}
      </td>
      <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-secondary)" }}>{item.status}</td>
      <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-secondary)" }}>
        {item.assignees.map((a) => a.login).join(", ") || "—"}
      </td>
      <td style={{ padding: "8px 12px", fontSize: 12 }}>
        <span style={{ color: "var(--accent-blue)" }}>{item.source === "jira" ? item.issueId : item.repo}</span>
      </td>
      <td style={{ padding: "8px 12px", fontSize: 11 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {item.labels.map((l) => (
            <span key={l.name} style={{ padding: "1px 6px", background: `#${l.color}22`, color: `#${l.color}`, borderRadius: 10, fontSize: 10, border: `1px solid #${l.color}44` }}>
              {l.name}
            </span>
          ))}
        </div>
      </td>
      <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)" }}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
