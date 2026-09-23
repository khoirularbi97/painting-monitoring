import { useEffect, useRef, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
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

  // ranking controls (default sort by avg_ok_final)
  const [rankingMetric, setRankingMetric] = useState("avg_ok_final");
  const [rankingLimit, setRankingLimit] = useState(8);
  const [rankingLineFilter, setRankingLineFilter] = useState("");
  // weights (percent values, will be normalized)
  const [wOkFinal, setWOkFinal] = useState(50);
  const [wComp, setWComp] = useState(20);
  const [wOkAwal, setWOkAwal] = useState(20);
  const [wPart, setWPart] = useState(10);

  function normalizeWeights(changes) {
    const raw = {
      wOkFinal,
      wComp,
      wOkAwal,
      wPart,
      ...changes,
    };
    const vals = [raw.wOkFinal || 0, raw.wComp || 0, raw.wOkAwal || 0, raw.wPart || 0];
    const sum = vals.reduce((s, v) => s + v, 0);
    if (sum === 0) {
      // fallback defaults
      setWOkFinal(50);
      setWComp(20);
      setWOkAwal(20);
      setWPart(10);
      return;
    }
    const scaled = vals.map((v) => (v * 100) / sum);
    const floored = scaled.map((f) => Math.floor(f));
    let remainder = 100 - floored.reduce((s, v) => s + v, 0);
    const fractions = scaled.map((f, i) => ({ i, frac: f - Math.floor(f) }));
    fractions.sort((a, b) => b.frac - a.frac);
    const add = new Array(4).fill(0);
    for (let k = 0; k < remainder; k++) add[fractions[k].i] = 1;
    const final = floored.map((v, i) => v + add[i]);
    setWOkFinal(final[0]);
    setWComp(final[1]);
    setWOkAwal(final[2]);
    setWPart(final[3]);
  }

  const leaderRanking = useMemo(() => {
    const lineName = rankingLineFilter ? (lines.find((ln) => String(ln.id) === String(rankingLineFilter))?.nama_line) : null;
    const sourceRows = rankingLineFilter
      ? rows.filter((r) => (r.line_id && String(r.line_id) === String(rankingLineFilter)) || (lineName && r.nama_line === lineName))
      : rows;

    const agg = {};
    sourceRows.forEach((r) => {
      const name = r.nama_leader ?? r.leader ?? "-";
      if (!agg[name]) agg[name] = { name, total_part: 0, total_ok_final: 0, total_hanger: 0, total_comp: 0, total_ok_awal: 0, count: 0 };
      agg[name].total_part += Number(r.total_part) || 0;
      agg[name].total_ok_final += Number(r.total_ok_final) || 0;
      agg[name].total_hanger += Number(r.total_hanger) || 0;
      agg[name].total_comp += Number(r.total_comp) || 0;
      agg[name].total_ok_awal += Number(r.ok_awal) || 0;
      agg[name].count += 1;
    });

    const mapped = Object.values(agg).map((l) => ({
      ...l,
      avg_ok_final: l.total_part ? Math.round((l.total_ok_final / l.total_part) * 1000) / 10 : 0,
      avg_comp: l.total_part ? Math.round((l.total_comp / l.total_part) * 1000) / 10 : 0,
      avg_ok_awal: l.total_part ? Math.round((l.total_ok_awal / l.total_part) * 1000) / 10 : 0,
    }));

    const maxPart = mapped.length ? Math.max(...mapped.map((m) => m.total_part || 0)) : 0;
    const withOverall = mapped.map((l) => {
      const partNorm = maxPart ? (l.total_part / maxPart) * 100 : 0;
      const totalW = (wOkFinal || 0) + (wComp || 0) + (wOkAwal || 0) + (wPart || 0);
      const nwOkFinal = totalW ? (wOkFinal / totalW) : 0.5;
      const nwComp = totalW ? (wComp / totalW) : 0.2;
      const nwOkAwal = totalW ? (wOkAwal / totalW) : 0.2;
      const nwPart = totalW ? (wPart / totalW) : 0.1;

      const score = (
        nwOkFinal * (l.avg_ok_final || 0) +
        nwComp * (100 - (l.avg_comp || 0)) +
        nwOkAwal * (l.avg_ok_awal || 0) +
        nwPart * partNorm
      );
      return { ...l, overall_score: Math.round(score * 10) / 10 };
    });

    return withOverall.sort((a, b) => {
      if (rankingMetric === "overall") return b.overall_score - a.overall_score;
      if (rankingMetric === "avg_ok_final") return b.avg_ok_final - a.avg_ok_final;
      if (rankingMetric === "avg_comp") return b.avg_comp - a.avg_comp;
      if (rankingMetric === "avg_ok_awal") return b.avg_ok_awal - a.avg_ok_awal;
      if (rankingMetric === "total_part") return b.total_part - a.total_part;
      if (rankingMetric === "total_hanger") return b.total_hanger - a.total_hanger;
      return b.avg_ok_final - a.avg_ok_final;
    });
  }, [rows, lines, rankingMetric, rankingLineFilter, wOkFinal, wComp, wOkAwal, wPart]);

  const shiftHanger = {};
  rows.forEach((r) => {
    const shift = r.nama_shift || "-";
    if (!shiftHanger[shift]) shiftHanger[shift] = 0;
    shiftHanger[shift] += Number(r.total_hanger) || 0;
  });
  const shiftHangerList = Object.entries(shiftHanger).map(([shift, total]) => ({ shift, total }));

  // Export helpers for ranking and shift hanger
  function exportLeaderRankingExcel() {
    const cols = [
      { key: "name", label: "Leader" },
      { key: "avg_ok_final", label: "%OK Final (avg)" },
      { key: "avg_comp", label: "%Compound (avg)" },
      { key: "avg_ok_awal", label: "%OK Awal (avg)" },
      { key: "overall_score", label: "Bobot Keseluruhan" },
      { key: "total_part", label: "Total Part" },
      { key: "total_hanger", label: "Total Hanger" },
    ];
    const prepared = leaderRanking.map((l) => ({
      name: l.name,
      avg_ok_final: l.avg_ok_final,
      avg_comp: l.avg_comp,
      avg_ok_awal: l.avg_ok_awal,
      overall_score: l.overall_score,
      total_part: l.total_part,
      total_hanger: l.total_hanger,
    }));
    exportToExcel(prepared, cols, "ranking-leader");
  }

  function exportLeaderRankingPDF() {
    const cols = [
      { key: "name", label: "Leader" },
      { key: "avg_ok_final", label: "%OK Final (avg)" },
      { key: "avg_comp", label: "%Compound (avg)" },
      { key: "avg_ok_awal", label: "%OK Awal (avg)" },
      { key: "overall_score", label: "Bobot Keseluruhan" },
      { key: "total_part", label: "Total Part" },
      { key: "total_hanger", label: "Total Hanger" },
    ];
    const prepared = leaderRanking.map((l) => ({
      name: l.name,
      avg_ok_final: l.avg_ok_final,
      avg_comp: l.avg_comp,
      avg_ok_awal: l.avg_ok_awal,
      overall_score: l.overall_score,
      total_part: l.total_part,
      total_hanger: l.total_hanger,
    }));
    exportToPDF(prepared, cols, "ranking-leader", "Ranking Leader");
  }

  function exportShiftHangerExcel() {
    const cols = [
      { key: "shift", label: "Shift" },
      { key: "total", label: "Total Hanger" },
    ];
    exportToExcel(shiftHangerList, cols, "shift-hanger");
  }

  function exportShiftHangerPDF() {
    const cols = [
      { key: "shift", label: "Shift" },
      { key: "total", label: "Total Hanger" },
    ];
    exportToPDF(shiftHangerList, cols, "shift-hanger", "Perolehan Hanger per Shift");
  }

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

      {/* Leader ranking & hanger per shift summary */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 16 ,marginBottom: 16}}>
        <div className="card">
          <div className="ranking-header">
            <p className="ranking-title">Ranking leader</p>
            <div className="controls">
              <label style={{ fontSize: 13, color: "var(--ink-secondary)", margin: 0 }}>Urutkan:</label>
              <select value={rankingMetric} onChange={(e) => setRankingMetric(e.target.value)}>
                <option value="avg_ok_final">%OK final (rata-rata)</option>
                <option value="avg_comp">%Compound (rata-rata)</option>
                <option value="avg_ok_awal">%OK awal (rata-rata)</option>
                <option value="overall">Bobot keseluruhan</option>
                <option value="total_part">Total part</option>
                <option value="total_hanger">Total hanger</option>
              </select>
              <label style={{ fontSize: 13, color: "var(--ink-secondary)", margin: 0 }}>Line</label>
              <select value={rankingLineFilter} onChange={(e) => setRankingLineFilter(e.target.value)}>
                <option value="">Semua</option>
                {lines.map((ln) => <option key={ln.id} value={ln.id}>{ln.nama_line}</option>)}
              </select>
              <label style={{ fontSize: 13, color: "var(--ink-secondary)", margin: 0 }}>Tampilkan</label>
              <select value={rankingLimit} onChange={(e) => setRankingLimit(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
              <div className="ranking-actions">
                <button className="btn-ghost" onClick={exportLeaderRankingExcel}>Export Excel</button>
                <button className="btn-ghost" onClick={exportLeaderRankingPDF}>Export PDF</button>
              </div>
            </div>
          </div>
          <div className="ranking-controls">
            <div className="weight-control">
              <div className="label">Bobot %OK final</div>
              <div className="inputs">
                <input type="range" min={0} max={100} value={wOkFinal} onChange={(e) => normalizeWeights({ wOkFinal: Number(e.target.value) })} />
                <input type="number" min={0} max={100} value={wOkFinal} onChange={(e) => normalizeWeights({ wOkFinal: Number(e.target.value) })} style={{ width: 64 }} />
              </div>
            </div>
            <div className="weight-control">
              <div className="label">%Compound</div>
              <div className="inputs">
                <input type="range" min={0} max={100} value={wComp} onChange={(e) => normalizeWeights({ wComp: Number(e.target.value) })} />
                <input type="number" min={0} max={100} value={wComp} onChange={(e) => normalizeWeights({ wComp: Number(e.target.value) })} style={{ width: 64 }} />
              </div>
            </div>
            <div className="weight-control">
              <div className="label">Bobot %OK awal</div>
              <div className="inputs">
                <input type="range" min={0} max={100} value={wOkAwal} onChange={(e) => normalizeWeights({ wOkAwal: Number(e.target.value) })} />
                <input type="number" min={0} max={100} value={wOkAwal} onChange={(e) => normalizeWeights({ wOkAwal: Number(e.target.value) })} style={{ width: 64 }} />
              </div>
            </div>
            <div className="weight-control">
              <div className="label">Bobot Total part</div>
              <div className="inputs">
                <input type="range" min={0} max={100} value={wPart} onChange={(e) => normalizeWeights({ wPart: Number(e.target.value) })} />
                <input type="number" min={0} max={100} value={wPart} onChange={(e) => normalizeWeights({ wPart: Number(e.target.value) })} style={{ width: 64 }} />
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn-ghost"
                onClick={() => normalizeWeights({ wOkFinal: 50, wComp: 20, wOkAwal: 20, wPart: 10 })}
                title="Reset bobot ke default"
              >
                Reset
              </button>
              <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                <small>Jumlah: {wOkFinal + wComp + wOkAwal + wPart}%</small>
              </div>
            </div>
          </div>
          {leaderRanking.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Tidak ada data leader.</p>
          ) : (
            <ol className="ranking-list">
              {leaderRanking.slice(0, rankingLimit).map((l, idx) => (
                <li key={l.name}>
                  <div className="ranking-name">{idx + 1}. {l.name}</div>
                  <div className="ranking-metric">
                    {rankingMetric === "avg_ok_final" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.avg_ok_final}%</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_part.toLocaleString("id-ID")} part</span></>
                    ) : rankingMetric === "avg_comp" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.avg_comp}%</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_part.toLocaleString("id-ID")} part</span></>
                    ) : rankingMetric === "avg_ok_awal" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.avg_ok_awal}%</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_part.toLocaleString("id-ID")} part</span></>
                    ) : rankingMetric === "overall" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.overall_score}</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>score — {l.total_part.toLocaleString("id-ID")} part</span></>
                    ) : rankingMetric === "total_hanger" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.total_hanger.toLocaleString("id-ID")}</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_part.toLocaleString("id-ID")} part</span></>
                    ) : rankingMetric === "total_part" ? (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.total_part.toLocaleString("id-ID")}</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_hanger.toLocaleString("id-ID")} hanger</span></>
                    ) : (
                      <><strong style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}>{l.total_hanger.toLocaleString("id-ID")}</strong><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{l.total_part.toLocaleString("id-ID")} part</span></>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card">
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", margin: "0 0 12px" }}>Perolehan hanger per shift</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 8 }}>
            <button className="btn-ghost" onClick={exportShiftHangerExcel}>Export Excel</button>
            <button className="btn-ghost" onClick={exportShiftHangerPDF}>Export PDF</button>
          </div>
          {shiftHangerList.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Tidak ada data.</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={shiftHangerList} layout="vertical" margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
                  <CartesianGrid stroke="#f0f2f4" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="shift" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => v.toLocaleString("id-ID")} />
                  <Legend />
                  <Bar dataKey="total" name="Total hanger" fill="#2f6690" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric metric-success">
          <p className="metric-label">Rata-rata %OK awal</p>
          <p className="metric-value">{avgOkAwal}%</p>
        </div>
        <div className="metric metric-warn">
          <p className="metric-label">Rata-rata %OK final</p>
          <p className="metric-value">{avgOkFinal}%</p>
        </div>
        <div className="metric metric-danger">
          <p className="metric-label">Rata-rata %Compound</p>
          <p className="metric-value">{avgComp}%</p>
        </div>
        <div className="metric metric-success" style={{ gridColumn: "span 1" }}>
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
                  "total_hanger",
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
                      <th style={{ textAlign: "right" }}>Total hanger</th>
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
                          <td className="num">{r.total_hanger ?? "-"}</td>
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