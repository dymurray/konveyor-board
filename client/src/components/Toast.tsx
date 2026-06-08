import { useState, useEffect, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "error" | "success";
}

let toastId = 0;
let addToastFn: ((text: string, type: "error" | "success") => void) | null = null;

export function showToast(text: string, type: "error" | "success" = "error") {
  addToastFn?.(text, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: "error" | "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            background: t.type === "error" ? "#da3633" : "#238636",
            color: "#fff",
            fontSize: 13,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            animation: "slideIn 0.2s ease-out",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
