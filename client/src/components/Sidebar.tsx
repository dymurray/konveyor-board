import { FilterDropdown } from "./FilterDropdown";
import type { Filters } from "../hooks/useFilters";
import type { TeamMember } from "../types/project";

export type ViewType = "board" | "list" | "engineer";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  filters: Filters;
  availableRepos: string[];
  availableAssignees: string[];
  availableLabels: string[];
  onRepoFilter: (repos: string[]) => void;
  onAssigneeFilter: (assignees: string[]) => void;
  onLabelFilter: (labels: string[]) => void;
  onClearFilters: () => void;
  team: TeamMember[];
  secondsUntilRefresh: number;
  onRefresh: () => void;
}

const viewOptions: { key: ViewType; icon: string; label: string }[] = [
  { key: "board", icon: "▦", label: "Board" },
  { key: "list", icon: "☰", label: "List" },
  { key: "engineer", icon: "👤", label: "Engineers" },
];

export function Sidebar({
  currentView,
  onViewChange,
  filters,
  availableRepos,
  availableAssignees,
  availableLabels,
  onRepoFilter,
  onAssigneeFilter,
  onLabelFilter,
  onClearFilters,
  team,
  secondsUntilRefresh,
  onRefresh,
}: SidebarProps) {
  const hasFilters = filters.repos.length > 0 || filters.assignees.length > 0 || filters.labels.length > 0;

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        background: "#1a1a2e",
        borderRight: "1px solid var(--border)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflowY: "auto",
        height: "100vh",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 16, color: "#fff" }}>Konveyor Board</div>

      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.5 }}>
          Views
        </div>
        {viewOptions.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 8px",
              background: currentView === v.key ? "#2a2a4a" : "transparent",
              border: "none",
              borderRadius: 4,
              color: currentView === v.key ? "var(--accent-blue)" : "var(--text-secondary)",
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.5 }}>
          Filters
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <FilterDropdown label="Repo" options={availableRepos} selected={filters.repos} onChange={onRepoFilter} />
          <FilterDropdown label="Assignee" options={availableAssignees} selected={filters.assignees} onChange={onAssigneeFilter} />
          <FilterDropdown label="Label" options={availableLabels} selected={filters.labels} onChange={onLabelFilter} />
        </div>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              color: "var(--accent-blue)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.5 }}>
          Team ({team.length})
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>
          {team.map((m) => (
            <div key={m.github}>{m.name}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto" }}>
        <button
          onClick={onRefresh}
          style={{
            padding: "4px 10px",
            background: "#238636",
            border: "none",
            borderRadius: 4,
            color: "#fff",
            fontSize: 11,
            width: "100%",
          }}
        >
          ⟳ Refresh ({secondsUntilRefresh}s)
        </button>
      </div>
    </aside>
  );
}
