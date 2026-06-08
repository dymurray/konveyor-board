import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardCompact } from "./CardCompact";
import type { ProjectItem } from "../types/project";

interface SortableCardProps {
  item: ProjectItem;
  onSelect: (item: ProjectItem) => void;
}

function SortableCard({ item, onSelect }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <CardCompact item={item} onClick={() => onSelect(item)} />
    </div>
  );
}

interface BoardColumnProps {
  columnName: string;
  items: ProjectItem[];
  onSelectItem: (item: ProjectItem) => void;
}

export function BoardColumn({ columnName, items, onSelectItem }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnName });

  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 320,
        background: "var(--bg-secondary)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 48px)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{columnName}</span>
        <span style={{ color: "var(--text-muted)" }}>{items.length}</span>
      </div>
      <div ref={setNodeRef} style={{ padding: 8, overflowY: "auto", flex: 1 }}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableCard key={item.id} item={item} onSelect={onSelectItem} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
