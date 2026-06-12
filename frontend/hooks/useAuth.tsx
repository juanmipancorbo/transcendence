"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Token storage utilities
const TOKEN_KEY = "auth_tokens";
let tokenMemory: { accessToken: string; refreshToken: string } | null = null;

export function getTokens(): { accessToken: string; refreshToken: string } | null {
  if (tokenMemory) return tokenMemory;
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(TOKEN_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  tokenMemory = tokens;
  if (typeof window === "undefined") return;
  if (tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from stored tokens on mount
  useEffect(() => {
    const tokens = getTokens();
    if (tokens) {
      authApi
        .me(tokens.accessToken)
        .then(setUser)
        .catch(() => {
          setTokens(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = getTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const { accessToken } = await authApi.refresh(tokens.refreshToken);
      setTokens({ accessToken, refreshToken: tokens.refreshToken });
      return accessToken;
    } catch {
      setTokens(null);
      setUser(null);
      return null;
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { accessToken, refreshToken } = await authApi.login(email, password);
      setTokens({ accessToken, refreshToken });
      const userData = await authApi.me(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      const { accessToken, refreshToken } = await authApi.register(email, username, password);
      setTokens({ accessToken, refreshToken });
      const userData = await authApi.me(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const tokens = getTokens();
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch {
        // Continue logout even if API call fails
      }
    }
    setTokens(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
