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
import { useMilestoneIssues } from "../hooks/useMilestoneIssues";
import { api } from "../api/client";
import { getProjectNumber, getPollInterval } from "../api/config";
import type { ProjectItem, TeamMember, ReleaseConfig } from "../types/project";

const PROJECT_ID = getProjectNumber();
const POLL_INTERVAL = getPollInterval();

export function Shell() {
  const [view, setView] = useState<ViewType>("board");
  const [selectedItem, setSelectedItem] = useState<ProjectItem | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [releaseConfig, setReleaseConfig] = useState<ReleaseConfig | null>(null);
  const [releaseFilterActive, setReleaseFilterActive] = useState(true);

  const { items: boardItems, setItems, projectNodeId, currentSprint, loading, secondsUntilRefresh, refresh } = useProjectItems(PROJECT_ID, POLL_INTERVAL);
  const { columns } = useProjectColumns(PROJECT_ID);

  const activeMilestone = releaseFilterActive ? releaseConfig?.githubMilestone : undefined;
  const activeFixVersion = releaseFilterActive ? releaseConfig?.jiraFixVersion : undefined;

  const { items: milestoneItems } = useMilestoneIssues(activeMilestone, POLL_INTERVAL);
  const { tickets: jiraTickets } = useJiraTickets(POLL_INTERVAL, activeFixVersion);

  // Merge board items + milestone items, deduplicate by URL (board version wins — has status)
  const mergedItems = useMemo(() => {
    let activeBoardItems = boardItems;
    if (releaseFilterActive && currentSprint) {
      activeBoardItems = boardItems.filter((i) => i.sprint === currentSprint);
    }
    const boardUrls = new Set(activeBoardItems.map((i) => i.url));
    const extraMilestoneItems = milestoneItems.filter((i) => !boardUrls.has(i.url));
    return [...activeBoardItems, ...extraMilestoneItems];
  }, [boardItems, milestoneItems, releaseFilterActive, currentSprint]);

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
  } = useFilters(mergedItems);

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

  const toggleReleaseFilter = useCallback(() => {
    setReleaseFilterActive((prev) => !prev);
  }, []);

  const handleSelectItem = useCallback(
    (item: ProjectItem) => {
      const fresh = mergedItems.find((i) => i.id === item.id) ?? item;
      setSelectedItem(fresh);
    },
    [mergedItems],
  );

  if (loading && boardItems.length === 0) {
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
              {currentSprint && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>/</span>
                  <span style={{ color: "var(--accent-yellow)" }}>Sprint: {currentSprint}</span>
                </>
              )}
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
        {view === "engineer" && <EngineerView items={filteredItems} team={team} jiraTickets={jiraTickets} onSelectItem={handleSelectItem} />}
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
