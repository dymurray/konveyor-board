import { AssigneeEditor } from "./AssigneeEditor";
import { LabelEditor } from "./LabelEditor";
import type { ProjectItem, ProjectColumn, TeamMember } from "../types/project";

interface DetailPanelProps {
  item: ProjectItem;
  columns: ProjectColumn[];
  team: TeamMember[];
  onClose: () => void;
  onMoveCard: (item: ProjectItem, newStatus: string, newOptionId: string, fieldId: string, ghProjectId: string) => void;
  onUpdateAssignees: (item: ProjectItem, assignees: string[]) => void;
  onUpdateLabels: (item: ProjectItem, action: "add" | "remove", label: string) => void;
}

export function DetailPanel({ item, columns, team, onClose, onMoveCard, onUpdateAssignees, onUpdateLabels }: DetailPanelProps) {
  const uniqueColumns = [...new Map(columns.map((c) => [c.name, c])).values()];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        overflowY: "auto",
        zIndex: 500,
        boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
            {item.repoOwner}/{item.repo} #{item.number}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{item.title}</div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: "4px 8px", background: "var(--bg-tertiary)", border: "none", borderRadius: 4, color: "var(--text-secondary)", cursor: "pointer", fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6, letterSpacing: 0.5 }}>Status</div>
          <select
            value={item.status}
            onChange={(e) => {
              const col = columns.find((c) => c.name === e.target.value);
              if (col) onMoveCard(item, col.name, col.optionId, col.id, col.id);
            }}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {uniqueColumns.map((c) => (
              <option key={c.optionId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6, letterSpacing: 0.5 }}>Assignees</div>
          <AssigneeEditor assignees={item.assignees} team={team} onUpdate={(logins) => onUpdateAssignees(item, logins)} />
        </div>

        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6, letterSpacing: 0.5 }}>Labels</div>
          <LabelEditor
            labels={item.labels}
            repoOwner={item.repoOwner}
            repo={item.repo}
            onAdd={(label) => onUpdateLabels(item, "add", label)}
            onRemove={(label) => onUpdateLabels(item, "remove", label)}
          />
        </div>

        {item.body && (
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6, letterSpacing: 0.5 }}>Description</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.6,
                background: "var(--bg-primary)",
                padding: 12,
                borderRadius: 4,
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {item.body}
            </div>
          </div>
        )}

        <div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-blue)", fontSize: 12, textDecoration: "none" }}
          >
            View on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}
