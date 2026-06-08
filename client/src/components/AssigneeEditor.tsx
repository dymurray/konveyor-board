import { useState } from "react";
import type { Assignee, TeamMember } from "../types/project";

interface AssigneeEditorProps {
  assignees: Assignee[];
  team: TeamMember[];
  onUpdate: (logins: string[]) => void;
}

export function AssigneeEditor({ assignees, team, onUpdate }: AssigneeEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const currentLogins = assignees.map((a) => a.login);

  const add = (login: string) => {
    onUpdate([...currentLogins, login]);
    setShowDropdown(false);
  };

  const remove = (login: string) => {
    onUpdate(currentLogins.filter((l) => l !== login));
  };

  const available = team.filter((m) => !currentLogins.includes(m.github));

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {assignees.map((a) => (
          <span
            key={a.login}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              background: "var(--bg-tertiary)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--text-primary)",
            }}
          >
            @{a.login}
            <span onClick={() => remove(a.login)} style={{ color: "var(--accent-red)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
              ×
            </span>
          </span>
        ))}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: "3px 8px",
              background: "var(--bg-tertiary)",
              border: "1px dashed var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--accent-blue)",
              cursor: "pointer",
            }}
          >
            + Add
          </button>
          {showDropdown && available.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 4,
                minWidth: 180,
                maxHeight: 200,
                overflowY: "auto",
                zIndex: 200,
              }}
            >
              {available.map((m) => (
                <div
                  key={m.github}
                  onClick={() => add(m.github)}
                  style={{ padding: "4px 8px", fontSize: 12, color: "var(--text-primary)", cursor: "pointer", borderRadius: 4 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {m.name} <span style={{ color: "var(--text-muted)" }}>@{m.github}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
