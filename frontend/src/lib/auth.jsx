import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, SESSION_EXPIRED } from "./api.js";
import { clearToken, getToken, setToken } from "./session.js";
import { resetNotifications } from "./notifications.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // "loading": memeriksa token yang tersimpan; "out": belum login; "in": sudah login.
  const [status, setStatus] = useState(getToken() ? "loading" : "out");
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api.get("/auth/me")
      .then(({ data }) => { if (!cancelled) { setUser(data.user); setStatus("in"); } })
      .catch((err) => {
        if (cancelled) return;
        // 401 sudah ditangani interceptor. Gangguan jaringan/server tidur: biarkan token,
        // tampilkan login dengan pesan, bukan menghapus sesi yang mungkin masih sah.
        if (err?.response?.status !== 401) setNotice("Server belum merespons. Coba lagi sebentar.");
        setStatus("out");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus("out");
      setNotice("Sesi berakhir. Silakan login kembali.");
    };
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    setToken(data.token);
    setUser(data.user);
    setNotice("");
    setStatus("in");
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setNotice("");
    setStatus("out");
    resetNotifications();
  }, []);

  // Ganti password mengembalikan token baru; token lama otomatis tidak berlaku.
  const changePassword = useCallback(async (current_password, new_password) => {
    const { data } = await api.post("/auth/change-password", { current_password, new_password });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ status, user, notice, isAdmin: user?.role === "admin", login, logout, changePassword }),
    [status, user, notice, login, logout, changePassword]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
