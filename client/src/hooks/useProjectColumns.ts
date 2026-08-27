import { useState, useEffect, useMemo } from "react";
import { api } from "../api/client";
import type { ProjectColumn } from "../types/project";

export function useProjectColumns(projectId: number) {
  const initial = useMemo(() => api.getCachedColumns(projectId), [projectId]);
  const [columns, setColumns] = useState<ProjectColumn[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    api
      .getColumns(projectId)
      .then(setColumns)
      .catch(() => {
        // Keep the last-known columns rather than blanking the board on a
        // transient failure; the items hook surfaces the error.
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { columns, loading };
}
