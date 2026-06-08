import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Label } from "../types/project";

interface LabelEditorProps {
  labels: Label[];
  repoOwner: string;
  repo: string;
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}

export function LabelEditor({ labels, repoOwner, repo, onAdd, onRemove }: LabelEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [repoLabels, setRepoLabels] = useState<Label[]>([]);

  useEffect(() => {
    if (showDropdown && repoLabels.length === 0) {
      api.getRepoLabels(repoOwner, repo).then(setRepoLabels).catch(() => setRepoLabels([]));
    }
  }, [showDropdown, repoOwner, repo, repoLabels.length]);

  const currentNames = labels.map((l) => l.name);
  const available = repoLabels.filter((l) => !currentNames.includes(l.name));

  return (
    <div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {labels.map((l) => (
          <span
            key={l.name}
            style={{
              padding: "2px 8px",
              background: `#${l.color}22`,
              color: `#${l.color}`,
              borderRadius: 12,
              fontSize: 11,
              border: `1px solid #${l.color}44`,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {l.name}
            <span onClick={() => onRemove(l.name)} style={{ cursor: "pointer", fontSize: 13 }}>
              ×
            </span>
          </span>
        ))}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: "2px 8px",
              background: "var(--bg-tertiary)",
              border: "1px dashed var(--border)",
              borderRadius: 12,
              fontSize: 11,
              color: "var(--accent-blue)",
              cursor: "pointer",
            }}
          >
            + Add
          </button>
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 4,
                minWidth: 200,
                maxHeight: 200,
                overflowY: "auto",
                zIndex: 200,
              }}
            >
              {available.map((l) => (
                <div
                  key={l.name}
                  onClick={() => {
                    onAdd(l.name);
                    setShowDropdown(false);
                  }}
                  style={{ padding: "4px 8px", fontSize: 12, cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: `#${l.color}`, display: "inline-block" }} />
                  <span style={{ color: "var(--text-primary)" }}>{l.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
