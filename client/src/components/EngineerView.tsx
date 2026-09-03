import { useState, useMemo } from "react";
import { isCve } from "../api/jiraAdapter";
import type { ProjectItem, TeamMember } from "../types/project";

interface EngineerViewProps {
  items: ProjectItem[];
  team: TeamMember[];
  onSelectItem: (item: ProjectItem) => void;
}

const STATUS_ORDER = ["In Progress", "In Review", "Backlog"];

type SourceFilter = "both" | "github" | "jira";

function isJira(item: ProjectItem): boolean {
  return item.source === "jira";
}

export function EngineerView({ items, team, onSelectItem }: EngineerViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("both");

  // Bucket every item once: CVEs into a dedicated Security list, everything else
  // per engineer (by GitHub login) or into Unassigned. Jira items were adapted
  // with their assignee mapped to a GitHub login, so they group alongside that
  // engineer's GitHub work.
  const { perEngineer, unassigned, cves } = useMemo(() => {
    const map = new Map<string, ProjectItem[]>();
    for (const member of team) {
      map.set(member.github, []);
    }
    const unassigned: ProjectItem[] = [];
    const cves: ProjectItem[] = [];

    for (const item of items) {
      // GitHub items that are closed/done are noise here. Jira items are already
      // scoped to open work by the fetch query, so keep them all.
      if (!isJira(item) && (item.state === "CLOSED" || item.status.toLowerCase() === "done")) {
        continue;
      }
      if (isCve(item)) {
        cves.push(item);
        continue;
      }
      if (item.assignees.length === 0) {
        unassigned.push(item);
        continue;
      }
      let placed = false;
      for (const assignee of item.assignees) {
        const list = map.get(assignee.login);
        if (list) {
          list.push(item);
          placed = true;
        }
      }
      // Assigned to someone who isn't on the team — still surface it.
      if (!placed) unassigned.push(item);
    }

    cves.sort((a, b) => b.issueId.localeCompare(a.issueId));
    return { perEngineer: map, unassigned, cves };
  }, [items, team]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Apply the source toggle to a mixed list.
  function bySource(list: ProjectItem[]): ProjectItem[] {
    if (sourceFilter === "github") return list.filter((i) => !isJira(i));
    if (sourceFilter === "jira") return list.filter(isJira);
    return list;
  }

  function renderGitHubItems(engineerItems: ProjectItem[]) {
    if (engineerItems.length === 0) return null;
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

  // Renders adapted Jira items (source === "jira"). `showAssignee` labels each
  // row with the engineer it's assigned to — used in the shared Security section.
  function renderJiraItems(tickets: ProjectItem[], label = "JIRA", showAssignee = false) {
    if (tickets.length === 0) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "#4c9aff", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10 }}>{label}</span> ({tickets.length})
        </div>
        {tickets.map((ticket) => {
          const type = ticket.issueType ?? "";
          const isRed = type.toLowerCase() === "bug" || type.toLowerCase() === "vulnerability";
          return (
            <a
              key={ticket.id}
              href={ticket.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 10px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${isRed ? "var(--accent-red)" : "#4c9aff"}`,
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
                  background: isRed ? "#da363322" : "#1f6feb22",
                  color: isRed ? "var(--accent-red)" : "#4c9aff",
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  {type}
                </span>
                <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ticket.title}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                {showAssignee && (
                  <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {ticket.assignees[0]?.name ?? ticket.assignees[0]?.login ?? "Unassigned"}
                  </span>
                )}
                {ticket.milestone && (
                  <span style={{ padding: "1px 5px", background: "#4c9aff22", color: "#4c9aff", borderRadius: 3, fontSize: 9 }}>
                    {ticket.milestone}
                  </span>
                )}
                <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>{ticket.status}</span>
                <span style={{ color: "#4c9aff", fontSize: 10, fontWeight: 500 }}>{ticket.issueId}</span>
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  const visibleCves = sourceFilter === "github" ? [] : cves;

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

      {visibleCves.length > 0 && (
        <div style={{ marginBottom: 16, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--accent-red)", overflow: "hidden" }}>
          <div
            onClick={() => toggle("__cves__")}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: collapsed.has("__cves__") ? "none" : "1px solid var(--border)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--accent-red)" }}>🔒 Security (CVEs)</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{visibleCves.length} items</span>
              <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{collapsed.has("__cves__") ? "▶" : "▼"}</span>
            </div>
          </div>
          {!collapsed.has("__cves__") && (
            <div style={{ padding: "10px 14px" }}>{renderJiraItems(visibleCves, "CVEs", true)}</div>
          )}
        </div>
      )}

      {[...team].sort((a, b) => a.name.localeCompare(b.name)).map((member) => {
        const memberItems = bySource(perEngineer.get(member.github) ?? []);
        const memberGh = memberItems.filter((i) => !isJira(i));
        const memberJira = memberItems.filter(isJira);
        const totalItems = memberItems.length;
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
                    {renderGitHubItems(memberGh)}
                    {renderJiraItems(memberJira)}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {(() => {
        const items = bySource(unassigned);
        if (items.length === 0) return null;
        const gh = items.filter((i) => !isJira(i));
        const jira = items.filter(isJira);
        return (
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
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{items.length} items</span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{collapsed.has("__unassigned__") ? "▶" : "▼"}</span>
              </div>
            </div>
            {!collapsed.has("__unassigned__") && (
              <div style={{ padding: "10px 14px" }}>
                {renderGitHubItems(gh)}
                {renderJiraItems(jira)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
