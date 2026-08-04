import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "estoqueSync_user";
const CRED_KEY = "estoqueSync_credentials";

type Credentials = { username: string; password: string };

const DEFAULT_CREDENTIALS: Credentials = { username: "admin", password: "admin" };

function readCredentials(): Credentials {
  if (typeof window === "undefined") return DEFAULT_CREDENTIALS;
  try {
    const raw = window.localStorage.getItem(CRED_KEY);
    if (!raw) return DEFAULT_CREDENTIALS;
    const parsed = JSON.parse(raw) as Credentials;
    if (parsed?.username && parsed?.password) return parsed;
  } catch {
    /* ignore */
  }
  return DEFAULT_CREDENTIALS;
}

type AuthContextValue = {
  ready: boolean;
  user: string | null;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
  changeCredentials: (currentPassword: string, next: Credentials) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser(window.localStorage.getItem(SESSION_KEY));
    setReady(true);
  }, []);

  const value: AuthContextValue = {
    ready,
    user,
    signIn: (username, password) => {
      const creds = readCredentials();
      if (username.trim() === creds.username && password === creds.password) {
        window.localStorage.setItem(SESSION_KEY, creds.username);
        setUser(creds.username);
        return true;
      }
      return false;
    },
    signOut: () => {
      window.localStorage.removeItem(SESSION_KEY);
      setUser(null);
    },
    changeCredentials: (currentPassword, next) => {
      const creds = readCredentials();
      if (currentPassword !== creds.password) return false;
      const updated: Credentials = {
        username: next.username.trim() || creds.username,
        password: next.password,
      };
      window.localStorage.setItem(CRED_KEY, JSON.stringify(updated));
      window.localStorage.setItem(SESSION_KEY, updated.username);
      setUser(updated.username);
      return true;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
