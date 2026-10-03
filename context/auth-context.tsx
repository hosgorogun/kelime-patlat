import React, { createContext, useContext } from "react";

export interface AuthContextValue {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  playerId: string;
  setPlayerId: (id: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  safeName: string;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  value,
  children,
}: {
  value: AuthContextValue;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
