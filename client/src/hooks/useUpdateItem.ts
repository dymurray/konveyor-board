import { useCallback } from "react";
import { api } from "../api/client";
import type { ProjectItem } from "../types/project";

interface UpdateCallbacks {
  onOptimisticUpdate: (updater: (items: ProjectItem[]) => ProjectItem[]) => void;
  onError: (message: string) => void;
  onSuccess: () => void;
}

export function useUpdateItem(projectId: number, callbacks: UpdateCallbacks) {
  const moveCard = useCallback(
    async (item: ProjectItem, newStatus: string, newOptionId: string, fieldId: string, ghProjectId: string) => {
      const previousStatus = item.status;
      const previousOptionId = item.statusOptionId;

      callbacks.onOptimisticUpdate((items) =>
        items.map((i) => (i.id === item.id ? { ...i, status: newStatus, statusOptionId: newOptionId } : i)),
      );

      try {
        await api.updateStatus(projectId, item.id, { fieldId, optionId: newOptionId, projectId: ghProjectId });
        callbacks.onSuccess();
      } catch {
        callbacks.onOptimisticUpdate((items) =>
          items.map((i) =>
            i.id === item.id ? { ...i, status: previousStatus, statusOptionId: previousOptionId } : i,
          ),
        );
        callbacks.onError("Failed to move card — reverted");
      }
    },
    [projectId, callbacks],
  );

  const updateAssignees = useCallback(
    async (item: ProjectItem, assignees: string[]) => {
      const previousAssignees = item.assignees;

      callbacks.onOptimisticUpdate((items) =>
        items.map((i) =>
          i.id === item.id ? { ...i, assignees: assignees.map((login) => ({ login, avatarUrl: "" })) } : i,
        ),
      );

      try {
        await api.setAssignees(item.repoOwner, item.repo, item.number, assignees);
        callbacks.onSuccess();
      } catch {
        callbacks.onOptimisticUpdate((items) =>
          items.map((i) => (i.id === item.id ? { ...i, assignees: previousAssignees } : i)),
        );
        callbacks.onError("Failed to update assignees — reverted");
      }
    },
    [callbacks],
  );

  const updateLabels = useCallback(
    async (item: ProjectItem, action: "add" | "remove", label: string) => {
      const previousLabels = item.labels;

      callbacks.onOptimisticUpdate((items) =>
        items.map((i) => {
          if (i.id !== item.id) return i;
          const newLabels =
            action === "add"
              ? [...i.labels, { name: label, color: "ededed" }]
              : i.labels.filter((l) => l.name !== label);
          return { ...i, labels: newLabels };
        }),
      );

      try {
        if (action === "add") {
          await api.addLabels(item.repoOwner, item.repo, item.number, [label]);
        } else {
          await api.removeLabel(item.repoOwner, item.repo, item.number, label);
        }
        callbacks.onSuccess();
      } catch {
        callbacks.onOptimisticUpdate((items) =>
          items.map((i) => (i.id === item.id ? { ...i, labels: previousLabels } : i)),
        );
        callbacks.onError(`Failed to ${action} label — reverted`);
      }
    },
    [callbacks],
  );

  return { moveCard, updateAssignees, updateLabels };
}
