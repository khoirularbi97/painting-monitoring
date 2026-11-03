import axios from "axios";
import { savedEndpoint } from "./push.js";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({ baseURL });

// Sertakan endpoint push perangkat ini pada input produksi/repair, supaya server
// tidak mengirim notifikasi ke perangkat si penginput sendiri.
api.interceptors.request.use((config) => {
  const url = config.url || "";
  if (config.method === "post" && (url === "/produksi" || url === "/repair")) {
    const endpoint = savedEndpoint();
    if (endpoint) config.headers["x-push-endpoint"] = endpoint;
  }
  return config;
});

export function extractErrors(err) {
  return err?.response?.data?.errors || ["Terjadi kesalahan tak terduga."];
}
