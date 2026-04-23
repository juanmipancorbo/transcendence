"use client";

export function useAuth() {
  return {
    user: { id: "1", username: "demo" },
    isAuthenticated: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}