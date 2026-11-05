import axios from "axios";
import { savedEndpoint } from "./push.js";
import { clearToken, getToken } from "./session.js";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({ baseURL });

// Sertakan endpoint push perangkat ini pada input produksi/repair, supaya server
// tidak mengirim notifikasi ke perangkat si penginput sendiri.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const url = config.url || "";
  if (config.method === "post" && (url === "/produksi" || url === "/repair")) {
    const endpoint = savedEndpoint();
    if (endpoint) config.headers["x-push-endpoint"] = endpoint;
  }
  return config;
});

// Sesi ditolak server (token kedaluwarsa, akun dinonaktifkan, password diganti di perangkat lain):
// hapus token dan beri tahu AuthProvider supaya kembali ke halaman login.
// Gagal login sendiri (/auth/login) tidak dihitung.
export const SESSION_EXPIRED = "auth:expired";
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !String(err.config?.url || "").startsWith("/auth/login") && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    return Promise.reject(err);
  }
);

export function extractErrors(err) {
  return err?.response?.data?.errors || ["Terjadi kesalahan tak terduga."];
}
