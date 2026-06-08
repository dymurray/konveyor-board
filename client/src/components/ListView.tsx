import { useState, useMemo, useCallback } from "react";
import { CardRow } from "./CardRow";
import type { ProjectItem, ProjectColumn } from "../types/project";

type SortKey = "title" | "status" | "repo" | "updatedAt";
type SortDir = "asc" | "desc";

interface ListViewProps {
  items: ProjectItem[];
  columns: ProjectColumn[];
  onSelectItem: (item: ProjectItem) => void;
}

export function ListView({ items, columns, onSelectItem }: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const toggleCheck = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (checked.size === sorted.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(sorted.map((i) => i.id)));
    }
  }, [checked.size, sorted]);

  const headerStyle = (key: SortKey) => ({
    padding: "8px 12px",
    fontSize: 11,
    textTransform: "uppercase" as const,
    color: sortKey === key ? "var(--accent-blue)" : "var(--text-secondary)",
    cursor: "pointer",
    userSelect: "none" as const,
    letterSpacing: 0.5,
  });

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
        List View
        {checked.size > 0 && (
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 12 }}>
            {checked.size} selected
          </span>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "8px 12px", width: 32 }}>
              <input type="checkbox" checked={checked.size === sorted.length && sorted.length > 0} onChange={toggleAll} style={{ accentColor: "var(--accent-blue)" }} />
            </th>
            <th style={headerStyle("title")} onClick={() => handleSort("title")}>Title{arrow("title")}</th>
            <th style={headerStyle("status")} onClick={() => handleSort("status")}>Status{arrow("status")}</th>
            <th style={{ ...headerStyle("title"), cursor: "default" }}>Assignees</th>
            <th style={headerStyle("repo")} onClick={() => handleSort("repo")}>Repo{arrow("repo")}</th>
            <th style={{ ...headerStyle("title"), cursor: "default" }}>Labels</th>
            <th style={headerStyle("updatedAt")} onClick={() => handleSort("updatedAt")}>Updated{arrow("updatedAt")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <CardRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={() => {
                setSelectedId(item.id);
                onSelectItem(item);
              }}
              onToggleCheck={() => toggleCheck(item.id)}
              checked={checked.has(item.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
