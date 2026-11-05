import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTanggal, formatTanggalTick } from "../lib/format.js";

const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e4e7f1", boxShadow: "0 8px 24px -8px rgba(22,27,51,.18)", fontSize: 12.5 };
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const CUSTOMER_COLORS = ["#3347c9", "#e3a82b", "#12804a", "#bf3049"];

const num = (v) => Number(v) || 0;
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

function pctOkFinal(r) {
  if (r.persen_ok_final != null) return num(r.persen_ok_final);
  return num(r.total_part) ? (num(r.total_ok_final) / num(r.total_part)) * 100 : 0;
}

// Compound final = compound yang belum selesai di-repair (compound awal dikurangi yang sudah diproses repair).
function compFinal(r) {
  return Math.max(0, num(r.total_comp) - num(r.ok_dari_repair) - num(r.ng_dari_repair));
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${BULAN[Number(m) - 1]} ${y}`;
}

// Semua rata-rata = jumlah %-per-baris dibagi jumlah baris (sama dengan kartu ringkasan).
export default function PerformaCharts({ rows, loading }) {
  const { daily, customers, monthly } = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.nama_customer).filter(Boolean))].sort();

    const byDay = {};
    rows.forEach((r) => {
      const day = String(r.tanggal).slice(0, 10);
      const c = r.nama_customer;
      if (!c) return;
      ((byDay[day] ??= {})[c] ??= []).push(pctOkFinal(r));
    });
    const daily = Object.keys(byDay).sort().map((day) => {
      const o = { tanggal: day };
      names.forEach((c) => { if (byDay[day][c]) o[c] = r1(mean(byDay[day][c])); });
      return o;
    });

    const byMonth = {};
    rows.forEach((r) => {
      const key = String(r.tanggal).slice(0, 7);
      (byMonth[key] ??= []).push(r);
    });
    const monthly = Object.keys(byMonth).sort().map((key) => {
      const list = byMonth[key];
      const eff = list.map((r) => r.efisiensi_hanger).filter((v) => v != null).map(Number);
      return {
        bulan: monthLabel(key),
        ok_final: r1(mean(list.map(pctOkFinal))),
        comp_final: r1(mean(list.map((r) => (num(r.total_part) ? (compFinal(r) / num(r.total_part)) * 100 : 0)))),
        total_hanger: list.reduce((s, r) => s + num(r.total_hanger), 0),
        eff_hanger: r1(mean(eff)),
      };
    });
    return { daily, customers: names, monthly };
  }, [rows]);

  const axis = { tick: { fontSize: 11.5 }, tickLine: false };
  const empty = loading ? "Memuat data..." : "Belum ada data produksi untuk filter ini.";

  return (
    <>
      <div className="card section">
        <div className="card-head">
          <div>
            <p className="card-title">%OK final per hari per customer</p>
            <p className="card-note">Rata-rata %OK final semua line dan shift pada hari itu, dipisah per customer</p>
          </div>
        </div>
        {daily.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
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
          </ResponsiveContainer>
        )}
      </div>

      <div className="card section">
        <div className="card-head">
          <div>
            <p className="card-title">Performance per bulan</p>
            <p className="card-note">
              %OK final dan %Compound final = rata-rata %-per-baris. Efektif hanger = rata-rata part per hanger.
            </p>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="empty-note">{empty}</p>
        ) : (
          <div className="perf-grid">
            <div>
              <p className="perf-sub">Persentase</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e9ecf4" vertical={false} />
                  <XAxis dataKey="bulan" {...axis} axisLine={{ stroke: "#d2d7e6" }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...axis} axisLine={false} width={42} />
                  <Tooltip cursor={{ fill: "#f2f4f9" }} formatter={(v, n) => [`${v}%`, n]} contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 12.5 }} />
                  <Bar dataKey="ok_final" name="%OK final" fill="#12804a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="comp_final" name="%Compound final" fill="#e3a82b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="perf-sub">Hanger</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e9ecf4" vertical={false} />
                  <XAxis dataKey="bulan" {...axis} axisLine={{ stroke: "#d2d7e6" }} />
                  <YAxis yAxisId="total" {...axis} axisLine={false} width={48} tickFormatter={(v) => v.toLocaleString("id-ID")} />
                  <YAxis yAxisId="eff" orientation="right" {...axis} axisLine={false} width={36} />
                  <Tooltip cursor={{ fill: "#f2f4f9" }} formatter={(v, n) => [v.toLocaleString("id-ID"), n]} contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 12.5 }} />
                  <Bar yAxisId="total" dataKey="total_hanger" name="Total hanger (sumbu kiri)" fill="#3347c9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="eff" dataKey="eff_hanger" name="Rata-rata efektif hanger (sumbu kanan)" fill="#8a97e8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
