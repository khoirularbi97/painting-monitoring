import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({ baseURL });

export function extractErrors(err) {
  return err?.response?.data?.errors || ["Terjadi kesalahan tak terduga."];
}
