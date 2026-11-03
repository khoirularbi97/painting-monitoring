import { useState } from "react";
import { NavLink } from "react-router-dom";

// Ikon garis tipis (stroke) supaya tampil konsisten di semua perangkat.
const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  produksi: <><path d="M12 5v14M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="4" /></>,
  repair: <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.3-.7-.7-2.3z" /></>,
  data: <><path d="M4 6h16M4 12h16M4 18h10" /></>,
  master: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/input-produksi", label: "Input produksi", icon: "produksi" },
  { to: "/input-repair", label: "Input repair", icon: "repair" },
  { to: "/kelola-data", label: "Kelola data", icon: "data" },
  { to: "/kelola-master", label: "Kelola master", icon: "master" },
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
        {navItems.map((item) => (
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
      </nav>
    </aside>
  );
}
