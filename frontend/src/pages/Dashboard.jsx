import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ line_id: "", shift_id: "", customer_id: "" });
  const [data, setData] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    api.get("/master/line").then((r) => setLines(r.data));
    api.get("/master/shift").then((r) => setShifts(r.data));
    api.get("/master/customer").then((r) => setCustomers(r.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.line_id) params.line_id = filters.line_id;
    if (filters.shift_id) params.shift_id = filters.shift_id;
    if (filters.customer_id) params.customer_id = filters.customer_id;

    setLoading(true);
    api.get("/dashboard/tren-ok", { params })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));

    setLoadingRows(true);
    api.get("/produksi", { params })
      .then((r) => setRows(r.data))
      .finally(() => setLoadingRows(false));
  }, [filters]);

  const totalPart = data.reduce((s, d) => s + d.total_part, 0);
  const avgOkAwal = data.length
    ? Math.round((data.reduce((s, d) => s + d.persen_ok_awal, 0) / data.length) * 10) / 10
    : 0;
  const avgOkFinal = data.length
    ? Math.round((data.reduce((s, d) => s + d.persen_ok_final, 0) / data.length) * 10) / 10
    : 0;

  return (
    <div>
      <h1 className="page-title">Dashboard performa painting</h1>
      <p className="page-subtitle">Tren %OK sebelum dan sesudah repair, per line/shift/customer</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-4">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Line</label>
            <select value={filters.line_id} onChange={(e) => setFilters({ ...filters, line_id: e.target.value })}>
              <option value="">Semua</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.nama_line}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Shift</label>
            <select value={filters.shift_id} onChange={(e) => setFilters({ ...filters, shift_id: e.target.value })}>
              <option value="">Semua</option>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, gridColumn: "span 2" }}>
            <label>Customer</label>
            <select value={filters.customer_id} onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}>
              <option value="">Semua</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.nama_customer}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric">
          <p className="metric-label">Rata-rata %OK awal</p>
          <p className="metric-value">{avgOkAwal}%</p>
        </div>
        <div className="metric">
          <p className="metric-label">Rata-rata %OK final</p>
          <p className="metric-value">{avgOkFinal}%</p>
        </div>
        <div className="metric" style={{ gridColumn: "span 2" }}>
          <p className="metric-label">Total part diproses</p>
          <p className="metric-value">{totalPart.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Memuat data...</p>
        ) : data.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Belum ada data produksi untuk filter ini.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid stroke="#e1e0d9" vertical={false} />
              <XAxis dataKey="tanggal" tick={{ fontSize: 12 }} />
              <YAxis domain={[70, 100]} tickFormatter={(v) => v + "%"} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => v + "%"} />
              <Line type="monotone" dataKey="persen_ok_awal" name="%OK awal" stroke="#85B7EB" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="persen_ok_final" name="%OK final" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: "var(--ink-secondary)", margin: "0 0 12px" }}>Detail data</p>
        {loadingRows ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Memuat data...</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Belum ada data untuk filter ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Line</th>
                  <th>Shift</th>
                  <th>Customer</th>
                  <th style={{ textAlign: "right" }}>Part</th>
                  <th style={{ textAlign: "right" }}>OK final</th>
                  <th style={{ textAlign: "right" }}>Comp</th>
                  <th style={{ textAlign: "right" }}>NG final</th>
                  <th style={{ textAlign: "right" }}>%OK final</th>
                  <th style={{ textAlign: "right" }}>Eff. hanger</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.produksi_id}>
                    <td>{r.tanggal}</td>
                    <td>{r.nama_line}</td>
                    <td>{r.nama_shift}</td>
                    <td>{r.nama_customer}</td>
                    <td className="num">{r.total_part}</td>
                    <td className="num"><span className="pill pill-ok">{r.total_ok_final}</span></td>
                    <td className="num"><span className="pill pill-comp">{r.total_comp}</span></td>
                    <td className="num"><span className="pill pill-ng">{r.total_ng_final}</span></td>
                    <td className="num">{r.persen_ok_final}%</td>
                    <td className="num">{r.efisiensi_hanger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}