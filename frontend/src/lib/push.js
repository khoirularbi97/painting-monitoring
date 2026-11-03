import { api } from "./api.js";

const ENDPOINT_KEY = "push-endpoint";

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Endpoint perangkat ini disimpan supaya server tidak mengirim notifikasi
// ke perangkat si penginput sendiri (lihat interceptor di api.js).
export function savedEndpoint() {
  try { return localStorage.getItem(ENDPOINT_KEY); } catch { return null; }
}

function saveEndpoint(value) {
  try {
    if (value) localStorage.setItem(ENDPOINT_KEY, value);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch { /* penyimpanan diblokir: abaikan */ }
}

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function enablePush() {
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Izin notifikasi tidak diberikan.");

  let key;
  try {
    key = (await api.get("/push/public-key")).data.publicKey;
  } catch (err) {
    throw new Error(err?.response?.data?.errors?.[0] || "Server belum siap. Coba lagi sebentar.");
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));

  await api.post("/push/subscribe", sub.toJSON());
  saveEndpoint(sub.endpoint);
}

export async function disablePush() {
  const sub = await getSubscription();
  if (sub) {
    await api.post("/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  saveEndpoint(null);
}

// Jalan diam-diam saat app dibuka: pastikan langganan yang ada tercatat di server
// (mis. database pernah di-reset atau langganan lama sudah dibersihkan).
export async function syncSubscription() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const sub = await getSubscription();
  if (!sub) return;
  await api.post("/push/subscribe", sub.toJSON()).catch(() => {});
  saveEndpoint(sub.endpoint);
}
