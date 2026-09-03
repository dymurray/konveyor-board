import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { BoardColumn } from "./BoardColumn";
import type { ProjectItem, ProjectColumn } from "../types/project";

interface BoardViewProps {
  items: ProjectItem[];
  columns: ProjectColumn[];
  projectNodeId: string;
  onSelectItem: (item: ProjectItem) => void;
  onMoveCard: (
    item: ProjectItem,
    newStatus: string,
    newOptionId: string,
    fieldId: string,
    ghProjectId: string,
  ) => void;
}

// Read-only column that collects adapted Jira items (source === "jira"), which
// have no GitHub board status to sort into. Board moves don't apply to them.
const JIRA_COLUMN = "🔒 Security / Jira";

export function BoardView({ items, columns, projectNodeId, onSelectItem, onMoveCard }: BoardViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columnNames = [...new Set(columns.map((c) => c.name))];

  const itemsByColumn = new Map<string, ProjectItem[]>();
  for (const name of columnNames) {
    itemsByColumn.set(name, []);
  }
  const jiraItems: ProjectItem[] = [];
  for (const item of items) {
    if (item.source === "jira") {
      jiraItems.push(item);
      continue;
    }
    const col = itemsByColumn.get(item.status);
    if (col) {
      col.push(item);
    } else {
      const uncategorized = itemsByColumn.get(columnNames[0]);
      uncategorized?.push(item);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedItemId = active.id as string;
    const targetColumn = over.id as string;

    const item = items.find((i) => i.id === draggedItemId);
    if (!item || item.status === targetColumn) return;
    // Jira items are read-only; they have no GitHub status to move.
    if (item.source === "jira") return;

    const col = columns.find((c) => c.name === targetColumn);
    if (!col) return;

    onMoveCard(item, targetColumn, col.optionId, col.id, projectNodeId);
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
        Board View
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16 }}>
          {columnNames.map((name) => (
            <BoardColumn key={name} columnName={name} items={itemsByColumn.get(name) ?? []} onSelectItem={onSelectItem} />
          ))}
          {jiraItems.length > 0 && (
            <BoardColumn columnName={JIRA_COLUMN} items={jiraItems} onSelectItem={onSelectItem} />
          )}
        </div>
      </DndContext>
    </div>
  );
}
