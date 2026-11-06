import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, CartesianGrid, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTanggal, formatTanggalTick } from "../lib/format.js";
import { DEFAULT_TARGET, TARGET_KEY, computeDaily, computeMonthly, computePartShare, readTarget } from "../lib/performa.js";

const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e4e7f1", boxShadow: "0 8px 24px -8px rgba(22,27,51,.18)", fontSize: 12.5 };
const LABEL = { fontSize: 11, fill: "#4f5878", fontWeight: 600 };
const CUSTOMER_COLORS = ["#3347c9", "#e3a82b", "#12804a", "#bf3049"];

// Semua rata-rata = jumlah %-per-baris dibagi jumlah baris (sama dengan kartu ringkasan).
export default function PerformaCharts({ rows, loading, dailyRef, monthlyRef, monthlyHangerRef, pieRef, children }) {
  const [target, setTarget] = useState(readTarget);
  const changeTarget = (v) => {
    setTarget(v);
    if (Number(v) > 0) { try { localStorage.setItem(TARGET_KEY, String(v)); } catch { /* abaikan */ } }
  };
  const targetNum = Number(target) > 0 ? Number(target) : DEFAULT_TARGET;

  const { daily, customers } = useMemo(() => computeDaily(rows), [rows]);
  const share = useMemo(() => computePartShare(rows), [rows]);
  const sharePie = share.filter((s) => s.total_part > 0);
  const shareTotal = share.reduce((s, x) => s + x.total_part, 0);
  const monthly = useMemo(() => computeMonthly(rows, targetNum), [rows, targetNum]);

  const axis = { tick: { fontSize: 11.5 }, tickLine: false };
  const empty = loading ? "Memuat data..." : "Belum ada data produksi untuk filter ini.";

  return (
    <>
      <div className="card" ref={dailyRef}>
        <div className="card-head">
          <div>
            <p className="card-title">%OK final per hari per customer</p>
            <p className="card-note">Rata-rata %OK final semua line dan shift pada hari itu, dipisah per customer</p>
          </div>
        </div>
        {daily.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
          <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 6, right: 12, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="#e9ecf4" vertical={false} />
              <XAxis dataKey="tanggal" tickFormatter={formatTanggalTick} {...axis} axisLine={{ stroke: "#d2d7e6" }} minTickGap={14} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...axis} axisLine={false} width={42} />
              <Tooltip cursor={{ fill: "#f2f4f9" }} formatter={(v, n) => [`${v}%`, n]} labelFormatter={formatTanggal} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#161b33", fontWeight: 650, marginBottom: 4 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 14, fontSize: 12.5 }} />
              {customers.map((c, i) => (
                <Bar key={c} dataKey={c} name={c} fill={CUSTOMER_COLORS[i % CUSTOMER_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={26} />
              ))}
            </BarChart>
          </ResponsiveContainer></div>
        )}
      </div>

      <div className="card" ref={pieRef}>
        <div className="card-head">
          <div>
            <p className="card-title">Perbandingan total part per customer</p>
            <p className="card-note">Jumlah part seluruh line dan shift pada periode yang difilter</p>
          </div>
        </div>
        {sharePie.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
          <div className="pie-wrap">
            <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                <Pie isAnimationActive={false} data={sharePie} dataKey="total_part" nameKey="name" innerRadius="52%" outerRadius="90%" paddingAngle={sharePie.length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2}>
                  {sharePie.map((s) => <Cell key={s.name} fill={CUSTOMER_COLORS[customers.indexOf(s.name) % CUSTOMER_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v.toLocaleString("id-ID")} part`, n]} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer></div>
            <div className="pie-legend">
              {share.map((s) => (
                <div key={s.name} className="pie-row">
                  <span className="pie-dot" style={{ background: CUSTOMER_COLORS[customers.indexOf(s.name) % CUSTOMER_COLORS.length] }} />
                  <span className="pie-name">{s.name}</span>
                  <strong>{s.total_part.toLocaleString("id-ID")}</strong>
                  <span className="pie-pct">{s.persen}%</span>
                </div>
              ))}
              <div className="pie-row pie-total"><span className="pie-name">Total</span><strong>{shareTotal.toLocaleString("id-ID")}</strong></div>
            </div>
          </div>
        )}
      </div>

      {children}

      <div className="card" ref={monthlyRef}>
        <div className="card-head">
          <div>
            <p className="card-title">Performance per bulan: persentase</p>
            <p className="card-note">
              Persentase = rata-rata %-per-baris. OEE = Availability (diasumsikan 100%) &times; Performance (part per hanger / target) &times; Quality (%OK final).
            </p>
          </div>
          <label className="perf-target">
            Target part/hanger
            <input type="number" min="1" step="any" value={target} onChange={(e) => changeTarget(e.target.value)} />
          </label>
        </div>
        {monthly.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
            <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 22, right: 8, left: 0, bottom: 0 }} barGap={3}>
                <CartesianGrid stroke="#e9ecf4" vertical={false} />
                <XAxis dataKey="bulan" {...axis} axisLine={{ stroke: "#d2d7e6" }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...axis} axisLine={false} width={42} />
                <Tooltip cursor={{ fill: "#f2f4f9" }} formatter={(v, n) => [`${v}%`, n]} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#161b33", fontWeight: 650, marginBottom: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 14, fontSize: 12.5 }} />
                <Bar dataKey="ok_final" name="%OK final" fill="#12804a" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="ok_final" position="top" formatter={(v) => `${v}%`} style={LABEL} />
                </Bar>
                <Bar dataKey="comp_final" name="%Compound final" fill="#e3a82b" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="comp_final" position="top" formatter={(v) => `${v}%`} style={LABEL} />
                </Bar>
                <Bar dataKey="oee" name="OEE" fill="#7a3fc4" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="oee" position="top" formatter={(v) => `${v}%`} style={LABEL} />
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
        )}
      </div>

      <div className="card" ref={monthlyHangerRef}>
        <div className="card-head">
          <div>
            <p className="card-title">Performance per bulan: hanger</p>
            <p className="card-note">Sumbu kiri total hanger, sumbu kanan part per hanger, garis putus-putus = target {targetNum}.</p>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
            <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 22, right: 0, left: 0, bottom: 0 }} barGap={3}>
                <CartesianGrid stroke="#e9ecf4" vertical={false} />
                <XAxis dataKey="bulan" {...axis} axisLine={{ stroke: "#d2d7e6" }} />
                <YAxis yAxisId="total" tickLine={false} axisLine={false} width={52} tick={{ fontSize: 11.5, fill: "#3347c9" }} tickFormatter={(v) => v.toLocaleString("id-ID")} />
                <YAxis yAxisId="eff" orientation="right" domain={[0, (max) => Math.ceil(Math.max(max, targetNum) * 1.2)]} tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11.5, fill: "#6a77d6" }} />
                <Tooltip cursor={{ fill: "#f2f4f9" }} formatter={(v, n) => [v.toLocaleString("id-ID"), n]} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#161b33", fontWeight: 650, marginBottom: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 14, fontSize: 12.5 }} />
                <ReferenceLine yAxisId="eff" y={targetNum} stroke="#6a77d6" strokeDasharray="5 4" />
                <Bar yAxisId="total" dataKey="total_hanger" name="Total hanger" fill="#3347c9" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="total_hanger" position="top" formatter={(v) => v.toLocaleString("id-ID")} style={LABEL} />
                </Bar>
                <Bar yAxisId="eff" dataKey="eff_hanger" name="Rata-rata efektif hanger" fill="#8a97e8" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="eff_hanger" position="top" formatter={(v) => v.toLocaleString("id-ID")} style={LABEL} />
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
        )}
      </div>
    </>
  );
}
