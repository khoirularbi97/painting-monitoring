import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api.js";
import { exportToExcel, exportToPDF, captureChartImage } from "../lib/export.js";
import PaginatedTable from "../components/PaginatedTable.jsx";

const EXPORT_COLUMNS = [
  { key: "tanggal", label: "Tanggal" },
  { key: "nama_line", label: "Line" },
  { key: "nama_shift", label: "Shift" },
  { key: "nama_customer", label: "Customer" },
  { key: "leader", label: "Leader" },
  { key: "total_part", label: "Total Part" },
  { key: "ok_awal", label: "OK Awal" },
  { key: "ng_awal", label: "NG Awal" },
  { key: "total_comp", label: "Comp Awal" },
  { key: "persen_ok_awal", label: "%OK Awal" },
  { key: "persen_comp", label: "%Compound" },
  { key: "total_ok_final", label: "OK Final" },
  { key: "total_ng_final", label: "NG Final" },
  { key: "persen_ok_final", label: "%OK Final" },
  { key: "efisiensi_hanger", label: "Eff. Hanger" },
];

export default function Dashboard() {
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  

  const [filters, setFilters] = useState({ line_id: "", shift_id: "", customer_id: "", leader_id: "", start: "", end: "" });
  const [data, setData] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    api.get("/master/line").then((r) => setLines(r.data));
    api.get("/master/shift").then((r) => setShifts(r.data));
    api.get("/master/customer").then((r) => setCustomers(r.data));
    api.get("/master/leader").then((r) => setLeaders(r.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.line_id) params.line_id = filters.line_id;
    if (filters.shift_id) params.shift_id = filters.shift_id;
    if (filters.customer_id) params.customer_id = filters.customer_id;
    if (filters.leader_id) params.leader_id = filters.leader_id;
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;

    setLoading(true);
    api.get("/dashboard/tren-ok", { params })
      .then((r) => {
        const mapped = (r.data || []).map((d) => {
          const part = Number(d.total_part) || 0;
          const okAwal = Number(d.ok_awal) || 0;
          const comp = Number(d.total_comp) || 0;
          return {
            ...d,
            persen_ok_awal: d.persen_ok_awal !== undefined && d.persen_ok_awal !== null
              ? Number(d.persen_ok_awal)
              : part ? Math.round((okAwal / part) * 1000) / 10 : 0,
            persen_comp: d.persen_comp !== undefined && d.persen_comp !== null
              ? Number(d.persen_comp)
              : part ? Math.round((comp / part) * 1000) / 10 : 0,
          };
        });
        setData(mapped);
      })
      .finally(() => setLoading(false));

    setLoadingRows(true);
    api.get("/produksi", { params })
      .then((r) => setRows(r.data))
      .finally(() => setLoadingRows(false));
  }, [filters]);

  const totalPart = data.reduce((s, d) => s + d.total_part, 0);
  function computePercentOkAwal(item) {
    const part = Number(item.total_part) || 0;
    const okAwal = Number(item.ok_awal) || 0;
    if (item.persen_ok_awal !== undefined && item.persen_ok_awal !== null) return Number(item.persen_ok_awal);
    return part ? Math.round((okAwal / part) * 1000) / 10 : 0;
  }

  function computePercentComp(item) {
    const part = Number(item.total_part) || 0;
    const comp = Number(item.total_comp) || 0;
    return part ? Math.round((comp / part) * 1000) / 10 : 0;
  }

  const avgOkAwal = data.length
    ? Math.round((data.reduce((s, d) => s + computePercentOkAwal(d), 0) / data.length) * 10) / 10
    : 0;
  const avgOkFinal = data.length
    ? Math.round((data.reduce((s, d) => s + (d.persen_ok_final || 0), 0) / data.length) * 10) / 10
    : 0;
  const avgComp = data.length
    ? Math.round((data.reduce((s, d) => s + computePercentComp(d), 0) / data.length) * 10) / 10
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
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Customer</label>
            <select value={filters.customer_id} onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}>
              <option value="">Semua</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.nama_customer}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Leader</label>
            <select value={filters.leader_id} onChange={(e) => setFilters({ ...filters, leader_id: e.target.value })}>
              <option value="">Semua</option>
              {leaders.map((ld) => <option key={ld.id} value={ld.id}>{ld.nama_leader}</option>)}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0, display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label>Dari tanggal</label>
              <input type="date" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Sampai</label>
              <input type="date" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
            </div>
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
        <div className="metric">
          <p className="metric-label">Rata-rata %Compound</p>
          <p className="metric-value">{avgComp}%</p>
        </div>
        <div className="metric" style={{ gridColumn: "span 1" }}>
          <p className="metric-label">Total part diproses</p>
          <p className="metric-value">{totalPart.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="card" ref={chartRef}>
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
              <Line type="monotone" dataKey="persen_comp" name="%Compound" stroke="#F2A900" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="persen_ok_final" name="%OK final" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", margin: 0 }}>Detail data</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-ghost"
              disabled={rows.length === 0}
              onClick={() => {
                const prepared = rows.map((r) => {
                  const part = Number(r.total_part) || 0;
                  const okAwal = Number(r.ok_awal) || 0;
                  const comp = Number(r.total_comp) || 0;
                  return {
                    ...r,
                    persen_ok_awal: r.persen_ok_awal ?? (part ? Math.round((okAwal / part) * 1000) / 10 : null),
                    persen_comp: part ? Math.round((comp / part) * 1000) / 10 : null,
                  };
                });
                const summary = [
                  { label: "Rata-rata %OK awal", value: `${avgOkAwal}%` },
                  { label: "Rata-rata %OK final", value: `${avgOkFinal}%` },
                  { label: "Rata-rata %Compound", value: `${avgComp}%` },
                  { label: "Total part diproses", value: totalPart.toLocaleString("id-ID") },
                ];
                exportToExcel(prepared, EXPORT_COLUMNS, "dashboard-painting", summary);
              }}
            >
              Export Excel
            </button>
            <button
              className="btn-ghost"
              disabled={rows.length === 0 || exportingPDF}
              onClick={async () => {
                setExportingPDF(true);
                try {
                  const chartImage = await captureChartImage(chartRef.current);
                  const prepared = rows.map((r) => {
                    const part = Number(r.total_part) || 0;
                    const okAwal = Number(r.ok_awal) || 0;
                    const comp = Number(r.total_comp) || 0;
                    return {
                      ...r,
                      persen_ok_awal: r.persen_ok_awal ?? (part ? Math.round((okAwal / part) * 1000) / 10 : null),
                      persen_comp: part ? Math.round((comp / part) * 1000) / 10 : null,
                    };
                  });
                  const summary = [
                    { label: "Rata-rata %OK awal", value: `${avgOkAwal}%` },
                    { label: "Rata-rata %OK final", value: `${avgOkFinal}%` },
                    { label: "Rata-rata %Compound", value: `${avgComp}%` },
                    { label: "Total part diproses", value: totalPart.toLocaleString("id-ID") },
                  ];
                  exportToPDF(prepared, EXPORT_COLUMNS, "dashboard-painting", "Dashboard Performa Painting", chartImage, summary);
                } finally {
                  setExportingPDF(false);
                }
              }}
            >
              {exportingPDF ? "Menyiapkan..." : "Export PDF"}
            </button>
          </div>
        </div>
        {loadingRows ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Memuat data...</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Belum ada data untuk filter ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <PaginatedTable
              rows={rows}
              defaultPageSize={10}
              searchable
              searchKeys={[
                "tanggal",
                "nama_line",
                "nama_shift",
                "nama_customer",
                "leader",
                "total_part",
                "ok_awal",
                "ng_awal",
                "total_comp",
                "total_ok_final",
                "total_ng_final",
                "persen_ok_final",
              ]}
              searchPlaceholder="Cari tanggal, line, leader, part..."
            >
              {(currentRows) => (
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Line</th>
                      <th>Shift</th>
                      <th>Customer</th>
                      <th>Leader</th>
                      <th style={{ textAlign: "right" }}>Part</th>
                      <th style={{ textAlign: "right" }}>OK awal</th>
                      <th style={{ textAlign: "right" }}>NG awal</th>
                      <th style={{ textAlign: "right" }}>Comp awal</th>
                      <th style={{ textAlign: "right" }}>%OK awal</th>
                      <th style={{ textAlign: "right" }}>OK final</th>
                      <th style={{ textAlign: "right" }}>Comp</th>
                      <th style={{ textAlign: "right" }}>%Compound</th>
                      <th style={{ textAlign: "right" }}>NG final</th>
                      <th style={{ textAlign: "right" }}>%OK final</th>
                      <th style={{ textAlign: "right" }}>Eff. hanger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((r) => {
                      const part = Number(r.total_part) || 0;
                      const okAwal = Number(r.ok_awal) || 0;
                      const comp = Number(r.total_comp) || 0;
                      const persenOkAwalVal = r.persen_ok_awal !== undefined && r.persen_ok_awal !== null
                        ? Number(r.persen_ok_awal)
                        : part ? Math.round((okAwal / part) * 1000) / 10 : null;
                      const persenCompVal = part ? Math.round((comp / part) * 1000) / 10 : null;

                      return (
                        <tr key={r.produksi_id}>
                          <td>{r.tanggal}</td>
                          <td>{r.nama_line}</td>
                          <td>{r.nama_shift}</td>
                          <td>{r.nama_customer}</td>
                          <td>{r.leader || "-"}</td>
                          <td className="num">{r.total_part}</td>
                          <td className="num"><span className="pill pill-ok">{r.ok_awal}</span></td>
                          <td className="num"><span className="pill pill-ng">{r.ng_awal}</span></td>
                          <td className="num"><span className="pill pill-comp">{r.total_comp}</span></td>
                          <td className="num">{persenOkAwalVal == null ? "-" : `${persenOkAwalVal}%`}</td>
                          <td className="num"><span className="pill pill-ok">{r.total_ok_final}</span></td>
                          <td className="num"><span className="pill pill-comp">{r.total_comp}</span></td>
                          <td className="num">{persenCompVal == null ? "-" : `${persenCompVal}%`}</td>
                          <td className="num"><span className="pill pill-ng">{r.total_ng_final}</span></td>
                          <td className="num">{r.persen_ok_final}%</td>
                          <td className="num">{r.efisiensi_hanger}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </PaginatedTable>
          </div>
        )}
      </div>
    </div>
  );
}