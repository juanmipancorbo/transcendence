"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/types";
import { authApi, tokenStore } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Bootstrap: try to restore session via refresh cookie ────────────────
  useEffect(() => {
    (async () => {
      try {
        // The backend will verify the httpOnly refresh cookie and return a new access token
        const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (res.ok) {
          const { accessToken } = await res.json();
          tokenStore.set(accessToken);
          const me = await authApi.me();
          setUser(me);
        }
      } catch {
        // No valid session — stay logged out
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    await authApi.login({ username, password });
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    await authApi.register({ username, email, password, confirmPassword });
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
