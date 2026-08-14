"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import { getTokens, setTokens } from "@/lib/auth-storage";
import type { User } from "@/types";

export { getTokens } from "@/lib/auth-storage";

// A Google account without a profile yet cannot be logged in until the user
// picks a username, which setupGoogleUsername then posts back.
export type GoogleLoginOutcome = "authenticated" | "username-required";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (code: string, state: string) => Promise<GoogleLoginOutcome>;
  setupGoogleUsername: (username: string, state: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {

    const tokens = getTokens();
    if (!tokens?.accessToken){
      setUser(null);
      return;
    }
    try {
      const userData = await authApi.me(tokens.accessToken);
      setUser(userData);
    } catch {
      setTokens(null);
      setUser(null);
    }
  }, []);
  // Initialize from stored tokens on mount
  useEffect(() => {
    const tokens = getTokens();
    if (tokens) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const startSession = async (tokens: { accessToken: string; refreshToken: string }) => {
    setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    const userData = await authApi.me(tokens.accessToken);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await startSession(await authApi.login(email, password));
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (code: string, state: string): Promise<GoogleLoginOutcome> => {
    setIsLoading(true);
    try {
      const result = await authApi.loginGoogle(code, state);
      if (result.status === "authenticated") {
        await startSession(result);
      }
      return result.status;
    } finally {
      setIsLoading(false);
    }
  };

  const setupGoogleUsername = async (username: string, state: string) => {
    setIsLoading(true);
    try {
      await startSession(await authApi.setupGoogleUsername(username, state));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      await startSession(await authApi.register(email, username, password));
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
		setUser,
        login,
		loginGoogle,
		setupGoogleUsername,
        register,
        logout,
        refreshUser,
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
