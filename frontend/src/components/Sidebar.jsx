import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "▣" },
  { to: "/input-produksi", label: "Input produksi", icon: "◫" },
  { to: "/input-repair", label: "Input repair", icon: "⎇" },
  { to: "/kelola-data", label: "Kelola data", icon: "▤" },
  { to: "/kelola-master", label: "Kelola master", icon: "⚙" },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const linkClass = ({ isActive }) => "sidebar-link" + (isActive ? " active" : "");

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-badge">P</div>
        <div className="sidebar-title">Monitoring painting</div>
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
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}