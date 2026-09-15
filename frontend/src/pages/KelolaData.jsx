import { useEffect, useState } from "react";
import { api, extractErrors } from "../lib/api.js";

function EditProduksiForm({ row, lines, shifts, customers, onCancel, onSaved }) {
  const [form, setForm] = useState({
    tanggal: row.tanggal,
    line_id: lines.find((l) => l.nama_line === row.nama_line)?.id || "",
    shift_id: shifts.find((s) => s.nama_shift === row.nama_shift)?.id || "",
    customer_id: customers.find((c) => c.nama_customer === row.nama_customer)?.id || "",
    total_part: row.total_part,
    total_ok: row.ok_awal,
    total_comp: row.total_comp,
    total_ng: row.ng_awal,
    total_hanger: row.total_hanger,
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await api.put(`/produksi/${row.produksi_id}`, form);
      onSaved();
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td colSpan={7}>
        <form onSubmit={handleSubmit} style={{ padding: 12, background: "#f7f8f7", borderRadius: 6 }}>
          {errors.length > 0 && (
            <div className="alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
          )}
          <div className="grid-4">
            <div className="field">
              <label>Tanggal</label>
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div className="field">
              <label>Line</label>
              <select value={form.line_id} onChange={(e) => setForm({ ...form, line_id: e.target.value })}>
                {lines.map((l) => <option key={l.id} value={l.id}>{l.nama_line}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Shift</label>
              <select value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: e.target.value })}>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Customer</label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.nama_customer}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-4">
            <div className="field">
              <label>Total part</label>
              <input type="number" value={form.total_part} onChange={(e) => setForm({ ...form, total_part: e.target.value })} />
            </div>
            <div className="field">
              <label>Total OK</label>
              <input type="number" value={form.total_ok} onChange={(e) => setForm({ ...form, total_ok: e.target.value })} />
            </div>
            <div className="field">
              <label>Total compound</label>
              <input type="number" value={form.total_comp} onChange={(e) => setForm({ ...form, total_comp: e.target.value })} />
            </div>
            <div className="field">
              <label>Total NG</label>
              <input type="number" value={form.total_ng} onChange={(e) => setForm({ ...form, total_ng: e.target.value })} />
            </div>
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
            <label>Total hanger</label>
            <input type="number" value={form.total_hanger} onChange={(e) => setForm({ ...form, total_hanger: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button className="btn-ghost" type="button" onClick={onCancel}>Batal</button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function EditRepairForm({ row, onCancel, onSaved }) {
  const [form, setForm] = useState({
    tanggal_repair: row.tanggal_repair,
    total_comp_diproses: row.total_comp_diproses,
    total_hasil_ok: row.total_hasil_ok,
    total_hasil_ng: row.total_hasil_ng,
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await api.put(`/repair/${row.id}`, form);
      onSaved();
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td colSpan={7}>
        <form onSubmit={handleSubmit} style={{ padding: 12, background: "#f7f8f7", borderRadius: 6 }}>
          {errors.length > 0 && (
            <div className="alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
          )}
          <div className="grid-4">
            <div className="field">
              <label>Tanggal repair</label>
              <input type="date" value={form.tanggal_repair} onChange={(e) => setForm({ ...form, tanggal_repair: e.target.value })} />
            </div>
            <div className="field">
              <label>Comp diproses</label>
              <input type="number" value={form.total_comp_diproses} onChange={(e) => setForm({ ...form, total_comp_diproses: e.target.value })} />
            </div>
            <div className="field">
              <label>Hasil OK</label>
              <input type="number" value={form.total_hasil_ok} onChange={(e) => setForm({ ...form, total_hasil_ok: e.target.value })} />
            </div>
            <div className="field">
              <label>Hasil NG</label>
              <input type="number" value={form.total_hasil_ng} onChange={(e) => setForm({ ...form, total_hasil_ng: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button className="btn-ghost" type="button" onClick={onCancel}>Batal</button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function KelolaData() {
  const [tab, setTab] = useState("produksi");
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [produksiRows, setProduksiRows] = useState([]);
  const [repairRows, setRepairRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get("/produksi"),
      api.get("/repair"),
    ]).then(([p, r]) => {
      setProduksiRows(p.data);
      setRepairRows(r.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get("/master/line").then((r) => setLines(r.data));
    api.get("/master/shift").then((r) => setShifts(r.data));
    api.get("/master/customer").then((r) => setCustomers(r.data));
    loadAll();
  }, []);

  async function handleDeleteProduksi(id) {
    if (!confirm("Hapus data produksi ini? Data repair terkait juga akan ikut terhapus.")) return;
    await api.delete(`/produksi/${id}`);
    loadAll();
  }

  async function handleDeleteRepair(id) {
    if (!confirm("Hapus data repair ini?")) return;
    await api.delete(`/repair/${id}`);
    loadAll();
  }

  return (
    <div>
      <h1 className="page-title">Kelola data</h1>
      <p className="page-subtitle">Edit atau hapus data produksi dan hasil repair yang sudah diinput</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={tab === "produksi" ? "btn" : "btn-ghost"}
          onClick={() => { setTab("produksi"); setEditingId(null); }}
        >
          Data produksi
        </button>
        <button
          className={tab === "repair" ? "btn" : "btn-ghost"}
          onClick={() => { setTab("repair"); setEditingId(null); }}
        >
          Data repair
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Memuat data...</p>
        ) : tab === "produksi" ? (
          produksiRows.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Belum ada data produksi.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th><th>Line</th><th>Shift</th><th>Customer</th>
                    <th style={{ textAlign: "right" }}>Part</th>
                    <th style={{ textAlign: "right" }}>%OK final</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {produksiRows.map((r) => (
                    editingId === `p-${r.produksi_id}` ? (
                      <EditProduksiForm
                        key={r.produksi_id}
                        row={r}
                        lines={lines} shifts={shifts} customers={customers}
                        onCancel={() => setEditingId(null)}
                        onSaved={() => { setEditingId(null); loadAll(); }}
                      />
                    ) : (
                      <tr key={r.produksi_id}>
                        <td>{r.tanggal}</td>
                        <td>{r.nama_line}</td>
                        <td>{r.nama_shift}</td>
                        <td>{r.nama_customer}</td>
                        <td className="num">{r.total_part}</td>
                        <td className="num">{r.persen_ok_final}%</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn-ghost" onClick={() => setEditingId(`p-${r.produksi_id}`)}>Edit</button>
                          <button className="btn-ghost" style={{ color: "var(--ng)" }} onClick={() => handleDeleteProduksi(r.produksi_id)}>Hapus</button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : repairRows.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Belum ada data repair.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal repair</th><th>Produksi asal</th>
                  <th style={{ textAlign: "right" }}>Comp diproses</th>
                  <th style={{ textAlign: "right" }}>Hasil OK</th>
                  <th style={{ textAlign: "right" }}>Hasil NG</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {repairRows.map((r) => (
                  editingId === `r-${r.id}` ? (
                    <EditRepairForm
                      key={r.id}
                      row={r}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => { setEditingId(null); loadAll(); }}
                    />
                  ) : (
                    <tr key={r.id}>
                      <td>{r.tanggal_repair}</td>
                      <td>{r.nama_line} · {r.nama_shift} · {r.nama_customer} · {r.tanggal_produksi}</td>
                      <td className="num">{r.total_comp_diproses}</td>
                      <td className="num">{r.total_hasil_ok}</td>
                      <td className="num">{r.total_hasil_ng}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="btn-ghost" onClick={() => setEditingId(`r-${r.id}`)}>Edit</button>
                        <button className="btn-ghost" style={{ color: "var(--ng)" }} onClick={() => handleDeleteRepair(r.id)}>Hapus</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}