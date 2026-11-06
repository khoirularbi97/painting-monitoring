import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import ServerBanner from "./components/ServerBanner.jsx";
import FileReadyBar from "./components/FileReadyBar.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InputProduksi from "./pages/InputProduksi.jsx";
import InputRepair from "./pages/InputRepair.jsx";
import KelolaData from "./pages/KelolaData.jsx";
import KelolaMaster from "./pages/KelolaMaster.jsx";
import KelolaPengguna from "./pages/KelolaPengguna.jsx";
import Login from "./pages/Login.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function Gate() {
  const { status } = useAuth();
  if (status === "loading") return <div className="boot">Memeriksa sesi...</div>;
  if (status === "out") return <Login />;
  return (
    <HashRouter>
      <ServerBanner />
      <FileReadyBar />
      <div className="app-shell">
        <Sidebar />
        <div className="main-col">
          <header className="topbar">
            <NotificationBell className="bell-desktop" />
          </header>
          <div className="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/input-produksi" element={<InputProduksi />} />
              <Route path="/input-repair" element={<InputRepair />} />
              <Route path="/kelola-data" element={<KelolaData />} />
              <Route path="/kelola-master" element={<AdminOnly><KelolaMaster /></AdminOnly>} />
              <Route path="/kelola-pengguna" element={<AdminOnly><KelolaPengguna /></AdminOnly>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
