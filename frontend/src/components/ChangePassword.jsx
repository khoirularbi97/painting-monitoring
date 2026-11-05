import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { extractErrors } from "../lib/api.js";

export default function ChangePassword({ onClose }) {
  const { changePassword } = useAuth();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (nw.length < 8) return setError("Password baru minimal 8 karakter.");
    if (nw !== again) return setError("Konfirmasi password tidak sama.");
    setBusy(true);
    try {
      await changePassword(cur, nw);
      setDone(true);
    } catch (err) {
      setError(extractErrors(err)[0]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Ganti password">
        <h3>Ganti password</h3>
        {done ? (
          <>
            <div className="login-alert">Password berhasil diganti. Perangkat lain perlu login ulang.</div>
            <div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Tutup</button></div>
          </>
        ) : (
          <>
            {error && <div className="login-alert is-error" role="alert">{error}</div>}
            <div className="field"><label>Password lama</label><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required autoFocus /></div>
            <div className="field"><label>Password baru</label><input type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" required /></div>
            <div className="field"><label>Ulangi password baru</label><input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required /></div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
              <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
