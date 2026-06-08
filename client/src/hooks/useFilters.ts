import { useState, useCallback, useMemo } from "react";
import type { ProjectItem } from "../types/project";

export interface Filters {
  repos: string[];
  assignees: string[];
  labels: string[];
}

export function useFilters(items: ProjectItem[]) {
  const [filters, setFilters] = useState<Filters>({ repos: [], assignees: [], labels: [] });

  const availableRepos = useMemo(() => [...new Set(items.map((i) => i.repo))].sort(), [items]);
  const availableAssignees = useMemo(
    () => [...new Set(items.flatMap((i) => i.assignees.map((a) => a.login)))].sort(),
    [items],
  );
  const availableLabels = useMemo(
    () => [...new Set(items.flatMap((i) => i.labels.map((l) => l.name)))].sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.repos.length > 0 && !filters.repos.includes(item.repo)) return false;
      if (filters.assignees.length > 0 && !item.assignees.some((a) => filters.assignees.includes(a.login)))
        return false;
      if (filters.labels.length > 0 && !item.labels.some((l) => filters.labels.includes(l.name))) return false;
      return true;
    });
  }, [items, filters]);

  const setRepoFilter = useCallback((repos: string[]) => setFilters((f) => ({ ...f, repos })), []);
  const setAssigneeFilter = useCallback((assignees: string[]) => setFilters((f) => ({ ...f, assignees })), []);
  const setLabelFilter = useCallback((labels: string[]) => setFilters((f) => ({ ...f, labels })), []);
  const clearFilters = useCallback(() => setFilters({ repos: [], assignees: [], labels: [] }), []);

  return {
    filters,
    filteredItems,
    availableRepos,
    availableAssignees,
    availableLabels,
    setRepoFilter,
    setAssigneeFilter,
    setLabelFilter,
    clearFilters,
  };
}
