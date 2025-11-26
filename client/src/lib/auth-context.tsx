import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
  error?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = "hpai-authenticated";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(stored === "true");
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true);
      setError(undefined);
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
    } else {
      setError("Invalid credentials. Use admin / admin123.");
      setIsAuthenticated(false);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setError(undefined);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      error,
    }),
    [isAuthenticated, login, logout, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
