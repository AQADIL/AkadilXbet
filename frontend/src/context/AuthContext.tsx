"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser, getUser, saveUser, clearUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((u: AuthUser) => {
    saveUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
