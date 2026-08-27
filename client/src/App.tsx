import { useAuth } from "./hooks/useAuth";
import { Shell } from "./components/Shell";
import { TokenInput } from "./components/TokenInput";

export function App() {
  const { user, setUser, loading, login, logout, error } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <TokenInput onSubmit={login} error={error} />;
  }

  return <Shell user={user} onUserChange={setUser} onSignOut={() => void logout()} />;
}
