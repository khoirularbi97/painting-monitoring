import { useSyncExternalStore } from "react";
import { api } from "./api.js";

// Riwayat notifikasi dipakai bersama oleh semua lonceng di layar (bar atas dan header mobile),
// jadi datanya diambil satu kali dan dibagikan, bukan per komponen.

const SEEN_KEY = "notif-last-seen";
const POLL_MS = 30000;

let state = { items: [], lastSeen: null, loaded: false, error: false };
const subscribers = new Set();
let timer = null;
let loading = false;

function emit() {
  state = { ...state };
  subscribers.forEach((fn) => fn());
}

function readSeen() {
  try {
    const v = localStorage.getItem(SEEN_KEY);
    return v === null ? null : Number(v);
  } catch { return null; }
}
function writeSeen(n) {
  try { localStorage.setItem(SEEN_KEY, String(n)); } catch { /* penyimpanan diblokir: abaikan */ }
}

export async function refreshNotifications() {
  if (loading) return;
  loading = true;
  try {
    const { data } = await api.get("/notifikasi", { params: { limit: 30 } });
    const items = Array.isArray(data) ? data : [];
    let seen = state.lastSeen ?? readSeen();
    // Kunjungan pertama: anggap yang sudah ada sebagai "sudah dilihat", supaya lencana
    // hanya menghitung aktivitas yang masuk sesudahnya.
    if (seen === null) {
      seen = items[0]?.id ?? 0;
      writeSeen(seen);
    }
    state = { items, lastSeen: seen, loaded: true, error: false };
  } catch {
    state = { ...state, loaded: true, error: true };
  } finally {
    loading = false;
    emit();
  }
}

// Dipakai demo saat data di-reset: lupakan penanda "sudah dilihat" dan ambil ulang.
export function resetNotifications() {
  try { localStorage.removeItem(SEEN_KEY); } catch { /* abaikan */ }
  state = { items: [], lastSeen: null, loaded: false, error: false };
  emit();
  refreshNotifications();
}

export function markAllRead() {
  const top = state.items[0]?.id;
  if (top == null || top <= (state.lastSeen ?? 0)) return;
  writeSeen(top);
  state = { ...state, lastSeen: top };
  emit();
}

function onVisible() {
  if (!document.hidden) refreshNotifications();
}

function start() {
  if (timer) return;
  refreshNotifications();
  timer = setInterval(onVisible, POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
}
function stop() {
  clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
}

function subscribe(fn) {
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size) stop();
  };
}

export function useNotifications() {
  const snap = useSyncExternalStore(subscribe, () => state);
  const seen = snap.lastSeen;
  const unread = seen == null ? 0 : snap.items.filter((i) => i.id > seen).length;
  return { ...snap, unread };
}
