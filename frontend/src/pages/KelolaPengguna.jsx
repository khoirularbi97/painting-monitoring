import { useCallback, useEffect, useState } from "react";
import { api, extractErrors } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { waktuRelatif } from "../lib/format.js";

const EMPTY = { username: "", nama: "", password: "", role: "operator" };

export default function KelolaPengguna() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [info, setInfo] = useState("");
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState("");

  const load = useCallback(async () => {
    try { setRows((await api.get("/users")).data); } catch (e) { setErrors(extractErrors(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function run(fn, okMsg) {
    setErrors([]); setInfo("");
    try { await fn(); setInfo(okMsg); await load(); return true; }
    catch (e) { setErrors(extractErrors(e)); return false; }
  }

  const add = async (e) => {
    e.preventDefault();
    if (await run(() => api.post("/users", form), "Pengguna ditambahkan.")) setForm(EMPTY);
  };
  const update = (id, body, msg) => run(() => api.put(`/users/${id}`, body), msg);
  const doReset = async (id) => {
    if (await run(() => api.put(`/users/${id}`, { password: resetPw }), "Password direset. Pengguna itu harus login ulang.")) {
      setResetId(null); setResetPw("");
    }
  };

  return (
    <div>
      <div className="page-head"><h2>Kelola pengguna</h2></div>

      {errors.length > 0 && <div className="login-alert is-error" role="alert">{errors.map((m) => <div key={m}>{m}</div>)}</div>}
      {info && <div className="login-alert" role="status">{info}</div>}

      <div className="card">
        <div className="card-head"><div className="card-title">Tambah pengguna</div></div>
        <form className="filters" onSubmit={add}>
          <div className="field"><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoCapitalize="none" required /></div>
          <div className="field"><label>Nama</label><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required /></div>
          <div className="field"><label>Password awal</label><input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required /></div>
          <div className="field"><label>Peran</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="operator">Operator</option><option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn">Tambah</button>
        </form>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Daftar pengguna</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Username</th><th>Nama</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th /></tr></thead>
            <tbody>
              {rows.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>{u.username}{self && <span className="pill pill-ok" style={{ marginLeft: 6 }}>Anda</span>}</td>
                    <td>{u.nama}</td>
                    <td>
                      <select value={u.role} disabled={self} onChange={(e) => update(u.id, { role: e.target.value }, "Peran diubah.")}>
                        <option value="operator">Operator</option><option value="admin">Admin</option>
                      </select>
                    </td>
                    <td><span className={"pill " + (u.active ? "pill-ok" : "pill-ng")}>{u.active ? "Aktif" : "Nonaktif"}</span></td>
                    <td>{u.last_login_at ? waktuRelatif(u.last_login_at) : "Belum pernah"}</td>
                    <td>
                      {resetId === u.id ? (
                        <div className="row-actions">
                          <input type="text" placeholder="Password baru (min. 8)" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
                          <button className="btn" onClick={() => doReset(u.id)} disabled={resetPw.length < 8}>Simpan</button>
                          <button className="btn-ghost" onClick={() => { setResetId(null); setResetPw(""); }}>Batal</button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button className="btn-ghost" onClick={() => { setResetId(u.id); setResetPw(""); }}>Reset password</button>
                          {!self && (
                            <button className={"btn-ghost" + (u.active ? " btn-danger" : "")} onClick={() => update(u.id, { active: !u.active }, u.active ? "Akun dinonaktifkan." : "Akun diaktifkan.")}>
                              {u.active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
