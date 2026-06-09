import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar, type ViewType } from "./Sidebar";
import { BoardView } from "./BoardView";
import { ListView } from "./ListView";
import { EngineerView } from "./EngineerView";
import { DetailPanel } from "./DetailPanel";
import { ToastContainer, showToast } from "./Toast";
import { useProjectItems } from "../hooks/useProjectItems";
import { useProjectColumns } from "../hooks/useProjectColumns";
import { useFilters } from "../hooks/useFilters";
import { useUpdateItem } from "../hooks/useUpdateItem";
import { useJiraTickets } from "../hooks/useJiraTickets";
import { api } from "../api/client";
import type { ProjectItem, TeamMember, ReleaseConfig } from "../types/project";

const PROJECT_ID = 67;
const POLL_INTERVAL = 30000;

export function Shell() {
  const [view, setView] = useState<ViewType>("board");
  const [selectedItem, setSelectedItem] = useState<ProjectItem | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [releaseConfig, setReleaseConfig] = useState<ReleaseConfig | null>(null);
  const [releaseFilterActive, setReleaseFilterActive] = useState(true);

  const { items, setItems, projectNodeId, loading, secondsUntilRefresh, refresh } = useProjectItems(PROJECT_ID, POLL_INTERVAL);
  const { columns } = useProjectColumns(PROJECT_ID);
  const { tickets: jiraTickets } = useJiraTickets(POLL_INTERVAL);
  const {
    filters,
    filteredItems,
    availableRepos,
    availableAssignees,
    availableLabels,
    availableMilestones,
    setRepoFilter,
    setAssigneeFilter,
    setLabelFilter,
    setMilestoneFilter,
    clearFilters,
  } = useFilters(items, releaseConfig?.githubMilestone);

  const { moveCard, updateAssignees, updateLabels } = useUpdateItem(PROJECT_ID, {
    onOptimisticUpdate: setItems,
    onError: (msg) => showToast(msg, "error"),
    onSuccess: () => void refresh(),
  });

  useEffect(() => {
    api.getTeam().then(setTeam).catch(() => setTeam([]));
    api.getConfig().then((cfg) => {
      if (cfg.release) {
        setReleaseConfig(cfg.release);
      }
    }).catch(() => {});
  }, []);

  const filteredJiraTickets = useMemo(() => {
    if (!releaseFilterActive || !releaseConfig?.jiraFixVersion) return jiraTickets;
    return jiraTickets.filter((t) => t.fixVersion === releaseConfig.jiraFixVersion);
  }, [jiraTickets, releaseFilterActive, releaseConfig]);

  const toggleReleaseFilter = useCallback(() => {
    setReleaseFilterActive((prev) => {
      const next = !prev;
      if (next && releaseConfig) {
        setMilestoneFilter([releaseConfig.githubMilestone]);
      } else {
        setMilestoneFilter([]);
      }
      return next;
    });
  }, [releaseConfig, setMilestoneFilter]);

  const handleSelectItem = useCallback(
    (item: ProjectItem) => {
      const fresh = items.find((i) => i.id === item.id) ?? item;
      setSelectedItem(fresh);
    },
    [items],
  );

  if (loading && items.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-secondary)" }}>
        Loading project data...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        currentView={view}
        onViewChange={setView}
        filters={filters}
        availableRepos={availableRepos}
        availableAssignees={availableAssignees}
        availableLabels={availableLabels}
        availableMilestones={availableMilestones}
        onRepoFilter={setRepoFilter}
        onAssigneeFilter={setAssigneeFilter}
        onLabelFilter={setLabelFilter}
        onMilestoneFilter={setMilestoneFilter}
        onClearFilters={clearFilters}
        team={team}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefresh={refresh}
      />
      <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {releaseConfig && (
          <div style={{
            padding: "8px 16px",
            background: releaseFilterActive ? "#23863615" : "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: releaseFilterActive ? "var(--accent-green)" : "var(--text-muted)",
                display: "inline-block",
              }} />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Release:</span>
              <span style={{ color: "var(--accent-green)" }}>{releaseConfig.githubMilestone}</span>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <span style={{ color: "#4c9aff" }}>{releaseConfig.jiraFixVersion}</span>
            </div>
            <button
              onClick={toggleReleaseFilter}
              style={{
                padding: "3px 10px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-secondary)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {releaseFilterActive ? "Show all tickets" : "Filter to release"}
            </button>
          </div>
        )}
        {view === "board" && (
          <BoardView items={filteredItems} columns={columns} projectNodeId={projectNodeId} onSelectItem={handleSelectItem} onMoveCard={moveCard} />
        )}
        {view === "list" && <ListView items={filteredItems} columns={columns} onSelectItem={handleSelectItem} />}
        {view === "engineer" && <EngineerView items={filteredItems} team={team} jiraTickets={filteredJiraTickets} onSelectItem={handleSelectItem} />}
      </main>
      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          columns={columns}
          team={team}
          onClose={() => setSelectedItem(null)}
          onMoveCard={moveCard}
          onUpdateAssignees={updateAssignees}
          onUpdateLabels={updateLabels}
        />
      )}
      <ToastContainer />
    </div>
  );
}
