import { useEffect, useState } from "react";
import { api, extractErrors } from "../lib/api.js";

export default function InputRepair() {
  const [menunggu, setMenunggu] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    tanggal_repair: new Date().toISOString().slice(0, 10),
    total_comp_diproses: "",
    total_hasil_ok: "",
    total_hasil_ng: "",
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function loadMenunggu() {
    api.get("/produksi/menunggu-repair").then((r) => setMenunggu(r.data));
  }

  useEffect(() => { loadMenunggu(); }, []);

  const sisa = selected?.sisa_belum_repair ?? 0;
  const jumlahHasil = Number(form.total_hasil_ok || 0) + Number(form.total_hasil_ng || 0);
  const overHasil = form.total_comp_diproses !== "" && jumlahHasil > Number(form.total_comp_diproses);
  const overSisa = form.total_comp_diproses !== "" && Number(form.total_comp_diproses) > Number(sisa);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    if (!selected) { setErrors(["Pilih data produksi yang akan direpair terlebih dahulu."]); return; }
    if (overHasil) { setErrors([`Total hasil OK + NG (${jumlahHasil}) melebihi total compound diproses (${form.total_comp_diproses}).`]); return; }
    if (overSisa) { setErrors([`Total compound diproses melebihi sisa yang belum direpair (${sisa}).`]); return; }

    setSaving(true);
    try {
      await api.post("/repair", { produksi_id: selected.produksi_id, ...form });
      setSuccess(true);
      setForm({ tanggal_repair: form.tanggal_repair, total_comp_diproses: "", total_hasil_ok: "", total_hasil_ng: "" });
      setSelected(null);
      loadMenunggu();
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Input hasil repair</h1>
      <p className="page-subtitle">Hasil repair Compound dari Dept PE — bisa diinput bertahap</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "var(--ink-secondary)", margin: "0 0 12px" }}>Menunggu repair</p>
        {menunggu.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Tidak ada Compound yang menunggu repair.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Tanggal</th><th>Line</th><th>Shift</th><th>Customer</th><th>Sisa</th><th></th></tr>
            </thead>
            <tbody>
              {menunggu.map((m) => (
                <tr key={m.produksi_id} style={selected?.produksi_id === m.produksi_id ? { background: "#f0f6fb" } : {}}>
                  <td>{m.tanggal}</td>
                  <td>{m.nama_line}</td>
                  <td>{m.nama_shift}</td>
                  <td>{m.nama_customer}</td>
                  <td className="num">{m.sisa_belum_repair}</td>
                  <td><button type="button" className="btn-ghost" onClick={() => { setSelected(m); setSuccess(false); }}>Pilih</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {success && <div className="alert-success">Hasil repair berhasil disimpan.</div>}
        {errors.length > 0 && (
          <div className="alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
        )}

        {!selected ? (
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Pilih salah satu data di tabel atas untuk mulai input.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 13, marginBottom: 14 }}>
              {selected.nama_line} · {selected.nama_shift} · {selected.nama_customer} · {selected.tanggal}
              <br />
              <span style={{ color: "var(--ink-secondary)" }}>Sisa belum direpair: {sisa}</span>
            </p>

            <div className="field">
              <label>Tanggal repair</label>
              <input type="date" value={form.tanggal_repair} onChange={(e) => setForm({ ...form, tanggal_repair: e.target.value })} required />
            </div>
            <div className="field">
              <label>Total compound diproses</label>
              <input type="number" min="0" value={form.total_comp_diproses} onChange={(e) => setForm({ ...form, total_comp_diproses: e.target.value })} required />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Total hasil OK</label>
                <input type="number" min="0" value={form.total_hasil_ok} onChange={(e) => setForm({ ...form, total_hasil_ok: e.target.value })} required />
              </div>
              <div className="field">
                <label>Total hasil NG</label>
                <input type="number" min="0" value={form.total_hasil_ng} onChange={(e) => setForm({ ...form, total_hasil_ng: e.target.value })} required />
              </div>
            </div>

            {(overHasil || overSisa) && (
              <div className="alert-error">
                {overHasil && <div>Total hasil OK + NG ({jumlahHasil}) melebihi total compound diproses ({form.total_comp_diproses}).</div>}
                {overSisa && <div>Total compound diproses melebihi sisa yang belum direpair ({sisa}).</div>}
              </div>
            )}

            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan hasil repair"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
