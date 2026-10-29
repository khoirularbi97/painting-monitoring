import { useEffect, useState } from "react";

// Di production VITE_API_URL berisi URL Render; di development lokal kosong
// dan request lewat proxy Vite (/api -> localhost:4000).
const BASE = import.meta.env.VITE_API_URL || "";
const HEALTH_URL = BASE ? `${BASE}/health` : "/api/health";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ServerBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Banner hanya muncul kalau server belum menjawab dalam 1,5 detik,
    // jadi tidak berkedip saat server sudah bangun.
    const slowTimer = setTimeout(() => {
      if (!cancelled) setWaking(true);
    }, 1500);

    async function waitUntilAwake() {
      while (!cancelled) {
        const ctrl = new AbortController();
        const abortTimer = setTimeout(() => ctrl.abort(), 8000);
        try {
          const res = await fetch(HEALTH_URL, { signal: ctrl.signal, cache: "no-store" });
          clearTimeout(abortTimer);
          if (res.ok) break;
        } catch {
          clearTimeout(abortTimer);
        }
        await sleep(3000);
      }
      clearTimeout(slowTimer);
      if (!cancelled) setWaking(false);
    }

    waitUntilAwake();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fbf0dc",
        color: "#7a4d06",
        borderBottom: "1px solid #ecd9ae",
        padding: "10px 16px",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      Menyambungkan ke server… server gratis perlu sekitar 1 menit untuk bangun setelah lama tidak dipakai.
    </div>
  );
}