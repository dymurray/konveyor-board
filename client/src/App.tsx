import { useAuth } from "./hooks/useAuth";
import { Shell } from "./components/Shell";

export function App() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)" }}>Konveyor Board</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Sign in with GitHub to access the dashboard</p>
        <button
          onClick={login}
          style={{
            padding: "10px 24px",
            background: "#238636",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return <Shell />;
}
