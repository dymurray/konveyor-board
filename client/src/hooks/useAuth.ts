import { useState, useEffect, useCallback } from "react";
import { api, setAuthFailureHandler } from "../api/client";
import { getToken, setToken, clearToken } from "../api/token";
import type { AuthUser } from "../types/project";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      setError("Token is invalid or expired. Please enter a new one.");
    });

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((pat: string) => {
    setError(null);
    setToken(pat);
    setLoading(true);
    api
      .getMe()
      .then((u) => {
        setUser(u);
        setError(null);
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setError("Invalid token. Check that the token has the required scopes and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return { user, loading, login, logout, error };
}
