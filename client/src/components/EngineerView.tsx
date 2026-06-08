import { useState, useMemo } from "react";
import type { ProjectItem, TeamMember } from "../types/project";

interface EngineerViewProps {
  items: ProjectItem[];
  team: TeamMember[];
  onSelectItem: (item: ProjectItem) => void;
}

const STATUS_ORDER = ["In Progress", "In Review", "Backlog"];

export function EngineerView({ items, team, onSelectItem }: EngineerViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const byEngineer = useMemo(() => {
    const map = new Map<string, ProjectItem[]>();
    for (const member of team) {
      map.set(member.github, []);
    }
    const unassigned: ProjectItem[] = [];

    for (const item of items) {
      if (item.assignees.length === 0) {
        unassigned.push(item);
      } else {
        for (const assignee of item.assignees) {
          const list = map.get(assignee.login);
          if (list) {
            list.push(item);
          }
        }
      }
    }
    return { map, unassigned };
  }, [items, team]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function renderItems(engineerItems: ProjectItem[]) {
    const grouped = new Map<string, ProjectItem[]>();
    for (const status of STATUS_ORDER) {
      grouped.set(status, []);
    }
    for (const item of engineerItems) {
      const list = grouped.get(item.status);
      if (list) {
        list.push(item);
      } else {
        let other = grouped.get("Other");
        if (!other) {
          other = [];
          grouped.set("Other", other);
        }
        other.push(item);
      }
    }

    return [...grouped.entries()]
      .filter(([, items]) => items.length > 0)
      .map(([status, statusItems]) => (
        <div key={status} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {status} ({statusItems.length})
          </div>
          {statusItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{
                padding: "6px 10px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                marginBottom: 4,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                {item.title}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 10, whiteSpace: "nowrap" }}>
                {item.repo} #{item.number}
              </span>
            </div>
          ))}
        </div>
      ));
  }

  return (
    <div style={{ padding: 16, maxWidth: 800 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Engineer View
      </div>

      {team.map((member) => {
        const memberItems = byEngineer.map.get(member.github) ?? [];
        const isCollapsed = collapsed.has(member.github);

        return (
          <div key={member.github} style={{ marginBottom: 16, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div
              onClick={() => toggle(member.github)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: isCollapsed ? "none" : "1px solid var(--border)",
              }}
            >
              <div>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{member.name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>@{member.github}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{memberItems.length} items</span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{isCollapsed ? "▶" : "▼"}</span>
              </div>
            </div>
            {!isCollapsed && (
              <div style={{ padding: "10px 14px" }}>
                {memberItems.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No assigned items</div>
                ) : (
                  renderItems(memberItems)
                )}
              </div>
            )}
          </div>
        );
      })}

      {byEngineer.unassigned.length > 0 && (
        <div style={{ marginBottom: 16, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div
            onClick={() => toggle("__unassigned__")}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              borderBottom: collapsed.has("__unassigned__") ? "none" : "1px solid var(--border)",
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 13, color: "var(--accent-yellow)" }}>Unassigned</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{byEngineer.unassigned.length} items</span>
              <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{collapsed.has("__unassigned__") ? "▶" : "▼"}</span>
            </div>
          </div>
          {!collapsed.has("__unassigned__") && (
            <div style={{ padding: "10px 14px" }}>{renderItems(byEngineer.unassigned)}</div>
          )}
        </div>
      )}
    </div>
  );
}
