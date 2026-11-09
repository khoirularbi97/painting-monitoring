// Hitungan untuk chart performa. Dipakai bersama oleh chart di layar dan export Excel,
// supaya angka di keduanya pasti sama.
// Semua rata-rata = jumlah %-per-baris dibagi jumlah baris.

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const TARGET_KEY = "target-part-per-hanger";
export const DEFAULT_TARGET = 20;

export function readTarget() {
  try { const v = Number(localStorage.getItem(TARGET_KEY)); return v > 0 ? v : DEFAULT_TARGET; } catch { return DEFAULT_TARGET; }
}

const num = (v) => Number(v) || 0;
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

export function pctOkFinal(r) {
  if (r.persen_ok_final != null) return num(r.persen_ok_final);
  return num(r.total_part) ? (num(r.total_ok_final) / num(r.total_part)) * 100 : 0;
}

// %Compound awal = compound pada produksi (sebelum repair) dibagi total part.
export const pctCompAwal = (r) => (num(r.total_part) ? (num(r.total_comp) / num(r.total_part)) * 100 : 0);

// OEE = Availability (diasumsikan 100%) x Performance x Quality. Baris tanpa hanger: null (dilewati).
export function oeeRow(r, target) {
  if (r.efisiensi_hanger == null) return null;
  return pctOkFinal(r) * Math.min(1, Number(r.efisiensi_hanger) / target);
}

export function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${BULAN[Number(m) - 1]} ${y}`;
}

export function computeDaily(rows) {
  const customers = [...new Set(rows.map((r) => r.nama_customer).filter(Boolean))].sort();
  const byDay = {};
  rows.forEach((r) => {
    const c = r.nama_customer;
    if (!c) return;
    ((byDay[String(r.tanggal).slice(0, 10)] ??= {})[c] ??= []).push(pctOkFinal(r));
  });
  const daily = Object.keys(byDay).sort().map((day) => {
    const o = { tanggal: day };
    customers.forEach((c) => { if (byDay[day][c]) o[c] = r1(mean(byDay[day][c])); });
    return o;
  });
  return { daily, customers };
}

// Total part per customer (jumlah, bukan rata-rata) beserta porsinya terhadap seluruh part.
export function computePartShare(rows) {
  const tot = {};
  rows.forEach((r) => { if (r.nama_customer) tot[r.nama_customer] = (tot[r.nama_customer] || 0) + num(r.total_part); });
  const names = Object.keys(tot).sort();
  const sum = names.reduce((s, n) => s + tot[n], 0);
  return names.map((name) => ({ name, total_part: tot[name], persen: sum ? r1((tot[name] / sum) * 100) : 0 }));
}

export function computeMonthly(rows, target) {
  const byMonth = {};
  rows.forEach((r) => { (byMonth[String(r.tanggal).slice(0, 7)] ??= []).push(r); });
  return Object.keys(byMonth).sort().map((key) => {
    const list = byMonth[key];
    const oees = list.map((r) => oeeRow(r, target)).filter((v) => v != null);
    return {
      key,
      bulan: monthLabel(key),
      jumlah_baris: list.length,
      ok_final: r1(mean(list.map(pctOkFinal))),
      comp_awal: r1(mean(list.map(pctCompAwal))),
      oee: r1(mean(oees)),
      total_hanger: list.reduce((s, r) => s + num(r.total_hanger), 0),
      eff_hanger: r1(mean(list.map((r) => r.efisiensi_hanger).filter((v) => v != null).map(Number))),
    };
  });
}

// Lembar tambahan untuk Export Excel: angka persis seperti di chart.
export function buildChartSheets(rows, target) {
  const { daily, customers } = computeDaily(rows);
  const monthly = computeMonthly(rows, target);
  return [
    {
      name: "Chart Harian",
      columns: [{ key: "tanggal", label: "Tanggal" }, ...customers.map((c) => ({ key: c, label: `%OK Final ${c}` }))],
      rows: daily,
    },
    {
      name: "Chart Customer",
      columns: [{ key: "name", label: "Customer" }, { key: "total_part", label: "Total Part" }, { key: "persen", label: "Porsi (%)" }],
      rows: computePartShare(rows),
    },
    {
      name: "Chart Bulanan",
      columns: [
        { key: "key", label: "Bulan" },
        { key: "jumlah_baris", label: "Jumlah Baris" },
        { key: "ok_final", label: "%OK Final" },
        { key: "comp_awal", label: "%Compound Awal" },
        { key: "oee", label: `OEE (target ${target} part/hanger)` },
        { key: "total_hanger", label: "Total Hanger" },
        { key: "eff_hanger", label: "Rata-rata Efektif Hanger" },
      ],
      rows: monthly,
    },
  ];
}

// Kolom tambahan di sheet Data supaya chart bisa dicek ulang dengan rumus Excel.
export const CHECK_COLUMNS = [
  { key: "bulan", label: "Bulan" },
  { key: "total_hanger", label: "Total Hanger" },
  { key: "ok_dari_repair", label: "OK dari Repair" },
  { key: "ng_dari_repair", label: "NG dari Repair" },
  { key: "oee_row", label: "OEE Baris (%)" },
];

export function withCheckValues(r, target) {
  const oee = oeeRow(r, target);
  return {
    ...r,
    bulan: String(r.tanggal).slice(0, 7),
    oee_row: oee == null ? "" : r1(oee),
  };
}
