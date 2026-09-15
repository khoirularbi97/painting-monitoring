import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

export function extractErrors(err) {
  return err?.response?.data?.errors || ["Terjadi kesalahan tak terduga."];
}
