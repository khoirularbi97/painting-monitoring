import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { markAllRead, refreshNotifications, useNotifications } from "../lib/notifications.js";
import { waktuRelatif } from "../lib/format.js";
import PushToggle from "./PushToggle.jsx";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function TypeIcon({ type }) {
  return (
    <span className={"notif-icon notif-icon-" + (type === "repair" ? "repair" : "produksi")} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {type === "repair"
          ? <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.3-.7-.7-2.3z" />
          : <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></>}
      </svg>
    </span>
  );
}

// "/#/kelola-data" -> "/kelola-data"
function toPath(url) {
  return (url || "/").replace(/^\/#/, "") || "/";
}

// Lonceng + panel riwayat. className membedakan tempatnya (bar atas di desktop, header di mobile).
export default function NotificationBell({ className = "" }) {
  const { items, unread, loaded, error, lastSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const [seenAtOpen, setSeenAtOpen] = useState(0);
  const [panelTop, setPanelTop] = useState(null);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  function close() {
    setOpen(false);
    markAllRead();
  }

  function toggle() {
    if (open) return close();
    // Yang belum dibaca tetap ditandai selama panel terbuka; baru dianggap dibaca saat ditutup.
    setSeenAtOpen(lastSeen ?? 0);
    // Di layar sempit panel melayang selebar layar; posisinya dihitung dari letak lonceng.
    if (window.matchMedia("(max-width: 768px)").matches && rootRef.current) {
      setPanelTop(rootRef.current.getBoundingClientRect().bottom + 10);
    } else {
      setPanelTop(null);
    }
    refreshNotifications();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) close(); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  });

  function openItem(item) {
    close();
    navigate(toPath(item.url));
  }

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <div className={"bell " + className} ref={rootRef}>
      <button
        type="button"
        className={"bell-btn" + (open ? " is-open" : "")}
        onClick={toggle}
        aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && <span className="bell-badge">{badge}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifikasi" style={panelTop != null ? { top: panelTop } : undefined}>
          <div className="notif-head">
            <p className="notif-title">Notifikasi</p>
            {unread > 0 && <span className="notif-count">{unread} baru</span>}
          </div>

          <div className="notif-list">
            {!loaded && <p className="notif-empty">Memuat...</p>}
            {loaded && error && items.length === 0 && (
              <p className="notif-empty">Notifikasi belum bisa dimuat. Server mungkin sedang bangun, coba lagi sebentar.</p>
            )}
            {loaded && !error && items.length === 0 && (
              <p className="notif-empty">Belum ada aktivitas. Input produksi atau repair yang baru akan muncul di sini.</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={"notif-item" + (n.id > seenAtOpen ? " is-unread" : "")}
                onClick={() => openItem(n)}
              >
                <TypeIcon type={n.type} />
                <span className="notif-main">
                  <span className="notif-item-title">{n.title}</span>
                  <span className="notif-item-body">{n.body}</span>
                  <span className="notif-time">{waktuRelatif(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="notif-foot">
            <PushToggle variant="panel" />
          </div>
        </div>
      )}
    </div>
  );
}
