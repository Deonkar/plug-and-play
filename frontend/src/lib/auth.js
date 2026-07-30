import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatDetail } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("cos_token");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("cos_token");
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("cos_token", data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) { return { ok: false, error: formatDetail(e.response?.data?.detail) || e.message }; }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("cos_token", data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) { return { ok: false, error: formatDetail(e.response?.data?.detail) || e.message }; }
  };

  const logout = async () => {
    // Server-side revocation: bump token_version so the outstanding JWT dies
    try { await api.post("/auth/logout"); } catch { /* ignore — clearing local anyway */ }
    localStorage.removeItem("cos_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
