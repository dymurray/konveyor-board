import { useState, useMemo } from "react";
import type { ProjectItem, TeamMember, JiraTicket } from "../types/project";

interface EngineerViewProps {
  items: ProjectItem[];
  team: TeamMember[];
  jiraTickets: JiraTicket[];
  onSelectItem: (item: ProjectItem) => void;
}

const STATUS_ORDER = ["In Progress", "In Review", "Backlog"];

type SourceFilter = "both" | "github" | "jira";

export function EngineerView({ items, team, jiraTickets, onSelectItem }: EngineerViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("both");

  const byEngineer = useMemo(() => {
    const ghMap = new Map<string, ProjectItem[]>();
    const jiraMap = new Map<string, JiraTicket[]>();
    for (const member of team) {
      ghMap.set(member.github, []);
      jiraMap.set(member.jira_account_id, []);
    }
    const unassigned: ProjectItem[] = [];

    for (const item of items) {
      if (item.state === "CLOSED" || item.status.toLowerCase() === "done") {
        continue;
      }
      if (item.assignees.length === 0) {
        unassigned.push(item);
      } else {
        for (const assignee of item.assignees) {
          const list = ghMap.get(assignee.login);
          if (list) {
            list.push(item);
          }
        }
      }
    }

    for (const ticket of jiraTickets) {
      const list = jiraMap.get(ticket.assigneeId);
      if (list) {
        list.push(ticket);
      }
    }

    return { ghMap, jiraMap, unassigned };
  }, [items, team, jiraTickets]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function renderGitHubItems(engineerItems: ProjectItem[]) {
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
              <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                {item.title}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                {item.milestone && (
                  <span style={{ padding: "1px 5px", background: "#8b949e22", color: "var(--text-secondary)", borderRadius: 3, fontSize: 9 }}>
                    {item.milestone}
                  </span>
                )}
                {item.sprint && (
                  <span style={{ padding: "1px 5px", background: "#d2992222", color: "var(--accent-yellow)", borderRadius: 3, fontSize: 9 }}>
                    {item.sprint}
                  </span>
                )}
                <span style={{
                  padding: "1px 6px",
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 600,
                  background: item.status === "In Progress" ? "#23863622" : item.status === "In Review" ? "#1f6feb22" : "#8b949e22",
                  color: item.status === "In Progress" ? "var(--accent-green)" : item.status === "In Review" ? "var(--accent-blue)" : "var(--text-secondary)",
                }}>
                  {item.status}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
                  {item.repo} #{item.number}
                </span>
              </span>
            </div>
          ))}
        </div>
      ));
  }

  function renderJiraTickets(tickets: JiraTicket[]) {
    if (tickets.length === 0) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "#4c9aff", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10 }}>JIRA</span> ({tickets.length})
        </div>
        {tickets.map((ticket) => (
          <a
            key={ticket.key}
            href={ticket.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 10px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid #4c9aff",
              borderRadius: 4,
              marginBottom: 4,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", maxWidth: "70%" }}>
              <span style={{
                padding: "1px 5px",
                background: ticket.issueType.toLowerCase() === "bug" ? "#da363322" : "#1f6feb22",
                color: ticket.issueType.toLowerCase() === "bug" ? "var(--accent-red)" : "#4c9aff",
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                {ticket.issueType}
              </span>
              <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ticket.summary}
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              {ticket.fixVersion && (
                <span style={{ padding: "1px 5px", background: "#4c9aff22", color: "#4c9aff", borderRadius: 3, fontSize: 9 }}>
                  {ticket.fixVersion}
                </span>
              )}
              <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>{ticket.status}</span>
              <span style={{ color: "#4c9aff", fontSize: 10, fontWeight: 500 }}>{ticket.key}</span>
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          Engineer View
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-tertiary)", borderRadius: 6, padding: 2 }}>
          {(["both", "github", "jira"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSourceFilter(opt)}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                background: sourceFilter === opt ? "var(--bg-secondary)" : "transparent",
                color: sourceFilter === opt
                  ? (opt === "jira" ? "#4c9aff" : opt === "github" ? "var(--accent-green)" : "var(--text-primary)")
                  : "var(--text-muted)",
              }}
            >
              {opt === "both" ? "All" : opt === "github" ? "GitHub" : "JIRA"}
            </button>
          ))}
        </div>
      </div>

      {team.map((member) => {
        const memberItems = sourceFilter !== "jira" ? (byEngineer.ghMap.get(member.github) ?? []) : [];
        const memberJira = sourceFilter !== "github" ? (byEngineer.jiraMap.get(member.jira_account_id) ?? []) : [];
        const totalItems = memberItems.length + memberJira.length;
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
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{totalItems} items</span>
                {memberJira.length > 0 && (
                  <span style={{ fontSize: 10, color: "#4c9aff", padding: "1px 5px", background: "#4c9aff22", borderRadius: 3 }}>
                    {memberJira.length} JIRA
                  </span>
                )}
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{isCollapsed ? "▶" : "▼"}</span>
              </div>
            </div>
            {!isCollapsed && (
              <div style={{ padding: "10px 14px" }}>
                {totalItems === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No assigned items</div>
                ) : (
                  <>
                    {renderGitHubItems(memberItems)}
                    {renderJiraTickets(memberJira)}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sourceFilter !== "jira" && byEngineer.unassigned.length > 0 && (
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
            <div style={{ padding: "10px 14px" }}>{renderGitHubItems(byEngineer.unassigned)}</div>
          )}
        </div>
      )}
    </div>
  );
}
