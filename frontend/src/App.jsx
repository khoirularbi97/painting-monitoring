import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InputProduksi from "./pages/InputProduksi.jsx";
import InputRepair from "./pages/InputRepair.jsx";
import KelolaData from "./pages/KelolaData.jsx";
import KelolaMaster from "./pages/KelolaMaster.jsx";

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input-produksi" element={<InputProduksi />} />
            <Route path="/input-repair" element={<InputRepair />} />
            <Route path="/kelola-data" element={<KelolaData />} />
            <Route path="/kelola-master" element={<KelolaMaster />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}