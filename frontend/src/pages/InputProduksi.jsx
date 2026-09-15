import { useEffect, useState } from "react";
import { api, extractErrors } from "../lib/api.js";

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const emptyForm = {
  tanggal: yesterday(),
  line_id: "",
  shift_id: "",
  customer_id: "",
  total_part: "",
  total_ok: "",
  total_comp: "",
  total_ng: "",
  total_hanger: "",
};

export default function InputProduksi() {
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/master/line").then((r) => { setLines(r.data); setForm((f) => ({ ...f, line_id: r.data[0]?.id || "" })); });
    api.get("/master/shift").then((r) => { setShifts(r.data); setForm((f) => ({ ...f, shift_id: r.data[0]?.id || "" })); });
    api.get("/master/customer").then((r) => { setCustomers(r.data); setForm((f) => ({ ...f, customer_id: r.data[0]?.id || "" })); });
  }, []);

  const sisa = Number(form.total_ok || 0) + Number(form.total_comp || 0) + Number(form.total_ng || 0);
  const overLimit = form.total_part !== "" && sisa > Number(form.total_part);

  function update(field, value) {
    setForm({ ...form, [field]: value });
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    if (overLimit) {
      setErrors([`Total OK + Compound + NG (${sisa}) melebihi total part (${form.total_part}).`]);
      return;
    }
    setSaving(true);
    try {
      await api.post("/produksi", form);
      setSuccess(true);
      setForm({ ...emptyForm, tanggal: form.tanggal, line_id: form.line_id, shift_id: form.shift_id, customer_id: form.customer_id });
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Input produksi</h1>
      <p className="page-subtitle">Diisi per shift, tanggal mengikuti tanggal mulai shift (bisa H-1 dari waktu input)</p>

      <div className="card" style={{ maxWidth: 520 }}>
        {success && <div className="alert-success">Data produksi berhasil disimpan.</div>}
        {errors.length > 0 && (
          <div className="alert-error">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Tanggal produksi</label>
              <input type="date" value={form.tanggal} onChange={(e) => update("tanggal", e.target.value)} required />
            </div>
            <div className="field">
              <label>Line</label>
              <select value={form.line_id} onChange={(e) => update("line_id", e.target.value)} required>
                {lines.map((l) => <option key={l.id} value={l.id}>{l.nama_line}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Shift</label>
              <select value={form.shift_id} onChange={(e) => update("shift_id", e.target.value)} required>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Customer</label>
              <select value={form.customer_id} onChange={(e) => update("customer_id", e.target.value)} required>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.nama_customer}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Total part</label>
              <input type="number" min="0" value={form.total_part} onChange={(e) => update("total_part", e.target.value)} required />
            </div>
            <div className="field">
              <label>Total OK</label>
              <input type="number" min="0" value={form.total_ok} onChange={(e) => update("total_ok", e.target.value)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Total compound</label>
              <input type="number" min="0" value={form.total_comp} onChange={(e) => update("total_comp", e.target.value)} required />
            </div>
            <div className="field">
              <label>Total NG</label>
              <input type="number" min="0" value={form.total_ng} onChange={(e) => update("total_ng", e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label>Total hanger digunakan</label>
            <input type="number" min="0" value={form.total_hanger} onChange={(e) => update("total_hanger", e.target.value)} required />
          </div>

          {overLimit && (
            <div className="alert-error">
              Total OK + Compound + NG ({sisa}) melebihi total part ({form.total_part}). Periksa kembali.
            </div>
          )}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan data"}
          </button>
        </form>
      </div>
    </div>
  );
}
