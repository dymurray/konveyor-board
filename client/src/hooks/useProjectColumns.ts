import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { ProjectColumn } from "../types/project";

export function useProjectColumns(projectId: number) {
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getColumns(projectId)
      .then(setColumns)
      .catch(() => setColumns([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { columns, loading };
}
