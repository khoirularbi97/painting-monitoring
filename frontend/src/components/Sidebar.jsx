import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) => "sidebar-link" + (isActive ? " active" : "");
  return (
    <div className="sidebar">
      <div className="sidebar-title">Monitoring painting</div>
      <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
      <NavLink to="/input-produksi" className={linkClass}>Input produksi</NavLink>
      <NavLink to="/input-repair" className={linkClass}>Input repair</NavLink>
    </div>
  );
}
