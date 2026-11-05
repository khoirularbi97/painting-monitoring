import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { extractErrors } from "../lib/api.js";

export default function Login() {
  const { login, notice } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError(err?.response ? extractErrors(err)[0] : "Tidak dapat terhubung ke server. Server gratis mungkin sedang bangun, coba lagi 30 detik lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="sidebar-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18c4 0 4-12 8-12s4 12 8 12" /></svg>
        </div>
        <h1>Monitoring Painting</h1>
        <p>Pantau performa Line 1 dan Line 2: produksi, repair, dan persentase OK per shift.</p>
        <span className="login-company">PT Sanly Industries</span>
      </aside>

      <main className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <h2>Masuk</h2>
          <p className="login-sub">Gunakan akun yang diberikan admin.</p>

          {(error || notice) && (
            <div className={"login-alert" + (error ? " is-error" : "")} role="alert">{error || notice}</div>
          )}
          {import.meta.env.VITE_DEMO && (
            <div className="login-demo">
              Akun demo: <b>admin</b> / <b>admin123</b> (semua fitur) atau <b>operator</b> / <b>operator123</b> (tanpa hapus dan kelola master).
            </div>
          )}

          <div className="field">
            <label htmlFor="lg-user">Username</label>
            <input id="lg-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" autoFocus required />
          </div>
          <div className="field">
            <label htmlFor="lg-pass">Password</label>
            <div className="pw-wrap">
              <input id="lg-pass" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? "Sembunyikan" : "Lihat"}</button>
            </div>
          </div>
          <button className="btn login-submit" disabled={busy || !username || !password}>{busy ? "Memeriksa..." : "Masuk"}</button>
        </form>
      </main>
    </div>
  );
}
