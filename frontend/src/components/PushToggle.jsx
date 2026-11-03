import { useEffect, useState } from "react";
import {
  disablePush, enablePush, getSubscription, isIOS, isStandalone,
  pushSupported, syncSubscription,
} from "../lib/push.js";

function BellIcon() {
  return (
    <svg className="sidebar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="sidebar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

// Tombol "Pasang aplikasi" dan saklar notifikasi di bawah menu samping.
export default function PushToggle({ variant = "sidebar" }) {
  const [state, setState] = useState("loading"); // loading | unsupported | denied | off | on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    function onPrompt(e) { e.preventDefault(); setInstallEvent(e); }
    function onInstalled() { setInstallEvent(null); }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!pushSupported()) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      try {
        const sub = await getSubscription();
        if (cancelled) return;
        setState(sub && Notification.permission === "granted" ? "on" : "off");
        if (sub) syncSubscription();
      } catch {
        if (!cancelled) setState("unsupported");
      }
    }
    // Service worker hanya didaftarkan di build production (lihat main.jsx).
    if ("serviceWorker" in navigator) init(); else setState("unsupported");
    return () => { cancelled = true; };
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (state === "on") {
        await disablePush();
        setState("off");
      } else {
        await enablePush();
        setState("on");
      }
    } catch (err) {
      setError(err.message || "Gagal mengubah pengaturan notifikasi.");
      if (Notification.permission === "denied") setState("denied");
    } finally {
      setBusy(false);
    }
  }

  async function install() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice.catch(() => {});
    setInstallEvent(null);
  }

  let hint = "";
  if (state === "unsupported") {
    hint = isIOS() && !isStandalone()
      ? "Di iPhone/iPad: ketuk Bagikan, pilih Tambah ke Layar Utama, lalu buka aplikasi dari ikonnya untuk mengaktifkan notifikasi."
      : "Browser ini belum mendukung notifikasi.";
  } else if (state === "denied") {
    hint = "Notifikasi diblokir. Izinkan lewat pengaturan situs di browser, lalu muat ulang.";
  }

  const canToggle = state === "on" || state === "off";

  return (
    <div className={variant === "panel" ? "push-panel" : "sidebar-actions"}>
      {installEvent && (
        <button type="button" className={"side-btn" + (variant === "panel" ? " side-btn-light" : "")} onClick={install}>
          <span className="sidebar-icon"><DownloadIcon /></span>
          <span>Pasang aplikasi</span>
        </button>
      )}

      {state !== "loading" && (
        <button
          type="button"
          role="switch"
          aria-checked={state === "on"}
          className={"side-btn" + (variant === "panel" ? " side-btn-light" : "") + (state === "on" ? " is-on" : "")}
          onClick={toggle}
          disabled={!canToggle || busy}
        >
          <span className="sidebar-icon"><BellIcon /></span>
          <span className="side-btn-text">{busy ? "Memproses..." : variant === "panel" ? "Kirim notifikasi ke perangkat ini" : "Notifikasi"}</span>
          <span className="switch" aria-hidden="true"><span className="switch-knob" /></span>
        </button>
      )}

      {hint && <p className={"side-hint" + (variant === "panel" ? " side-hint-light" : "")}>{hint}</p>}
      {error && <p className={"side-hint side-hint-error" + (variant === "panel" ? " side-hint-light" : "")}>{error}</p>}
    </div>
  );
}
