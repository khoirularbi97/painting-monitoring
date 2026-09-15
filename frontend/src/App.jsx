import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InputProduksi from "./pages/InputProduksi.jsx";
import InputRepair from "./pages/InputRepair.jsx";

export default function App() {
  return (
    <HashRouter>
      <div style={{ background: "#fff3cd", padding: 10, fontSize: 12, fontFamily: "monospace" }}>
        DEBUG VITE_API_URL = "{String(import.meta.env.VITE_API_URL)}"
      </div>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input-produksi" element={<InputProduksi />} />
            <Route path="/input-repair" element={<InputRepair />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
