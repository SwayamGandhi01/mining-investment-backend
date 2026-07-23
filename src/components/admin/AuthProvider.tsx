"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshAdmin: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await axios.get("/api/auth/me");
      if (res.data.success) {
        setAdmin(res.data.data);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const login = async (email: string, password: string) => {
    const res = await axios.post("/api/auth/login", { email, password });
    if (res.data.success) {
      setAdmin(res.data.data);
    } else {
      throw new Error(res.data.message);
    }
  };

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setAdmin(null);
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refreshAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
