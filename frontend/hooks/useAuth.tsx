"use client";

/**
 * TODO:
 *   - Replace MOCK_USER with a real API call to /api/auth/me
 *   - Store the access token from /api/auth/login
 *   - Wire logout to /api/auth/logout
 */

import React, { createContext, useContext, useState } from "react";
import { MOCK_USER } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login:    (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start logged-in with the mock user
  const [user, setUser] = useState<User | null>(MOCK_USER);

  const login = async (_username: string, _password: string) => {
    // TODO: call authApi.login(), then authApi.me()
    setUser(MOCK_USER);
  };

  const register = async (_username: string, _email: string, _password: string) => {
    // TODO: call authApi.register(), then authApi.me()
    setUser(MOCK_USER);
  };

  const logout = async () => {
    // TODO: call authApi.logout()
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading:       false,   // never loading in mock
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
