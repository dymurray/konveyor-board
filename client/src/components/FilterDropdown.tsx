import { useState, useRef, useEffect } from "react";

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "4px 10px",
          background: selected.length > 0 ? "#1f6feb33" : "var(--bg-tertiary)",
          border: `1px solid ${selected.length > 0 ? "#1f6feb" : "var(--border)"}`,
          borderRadius: 12,
          color: selected.length > 0 ? "var(--accent-blue)" : "var(--text-secondary)",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {label} {selected.length > 0 && `(${selected.length})`} ▾
      </button>
      {open && (
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
            minWidth: 180,
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 100,
          }}
        >
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 8px",
                fontSize: 12,
                color: "var(--text-primary)",
                cursor: "pointer",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: "var(--accent-blue)" }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
