import { useState } from "react";
import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import ChangePassword from "./ChangePassword.jsx";
import { useAuth } from "../lib/auth.jsx";

// Ikon garis tipis (stroke) supaya tampil konsisten di semua perangkat.
const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  produksi: <><path d="M12 5v14M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="4" /></>,
  repair: <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.3-.7-.7-2.3z" /></>,
  data: <><path d="M4 6h16M4 12h16M4 18h10" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.7 3.5 2.6 3.5 5.7" /></>,
  master: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/input-produksi", label: "Input produksi", icon: "produksi" },
  { to: "/input-repair", label: "Input repair", icon: "repair" },
  { to: "/kelola-data", label: "Kelola data", icon: "data" },
  { to: "/kelola-master", label: "Kelola master", icon: "master", admin: true },
  { to: "/kelola-pengguna", label: "Kelola pengguna", icon: "users", admin: true },
];

function Icon({ name }) {
  return (
    <svg className="sidebar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const linkClass = ({ isActive }) => "sidebar-link" + (isActive ? " active" : "");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 18c4 0 4-12 8-12s4 12 8 12" />
          </svg>
        </div>
        <div className="sidebar-brand">
          <div className="sidebar-title">Monitoring Painting</div>
          <div className="sidebar-sub">PT Sanly Industries</div>
        </div>
        <NotificationBell className="bell-mobile" />
        <button
          type="button"
          className={"mobile-menu-toggle" + (mobileOpen ? " is-open" : "")}
          aria-label="Buka menu navigasi"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className={"sidebar-nav" + (mobileOpen ? " is-open" : "")}>
        {navItems.filter((i) => !i.admin || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar-icon"><Icon name={item.icon} /></span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="side-user">
          <div className="side-user-name">{user?.nama}</div>
          <div className="side-user-role">{isAdmin ? "Admin" : "Operator"}</div>
          <div className="side-user-actions">
            <button type="button" onClick={() => { setPwOpen(true); setMobileOpen(false); }}>Ganti password</button>
            <button type="button" onClick={logout}>Keluar</button>
          </div>
        </div>
      </nav>
      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </aside>
  );
}
