// Helper tanggal berbahasa Indonesia.
// Input berupa string "YYYY-MM-DD" (db.js menjaga kolom DATE tetap string).
// Di-parse manual tanpa new Date("YYYY-MM-DD") supaya tidak bergeser zona waktu.

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function isTanggal(value) {
  return typeof value === "string" && DATE_RE.test(value);
}

function parts(value) {
  if (!isTanggal(value)) return null;
  const [, y, m, d] = value.match(DATE_RE);
  const year = Number(y);
  const month = Number(m) - 1;
  const day = Number(d);
  // Date.UTC + getUTCDay: hari dihitung murni dari angka kalender, bebas timezone.
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
  return { year, month, day, weekday };
}

export function namaHari(value) {
  const p = parts(value);
  return p ? HARI[p.weekday] : "";
}

export function isMinggu(value) {
  const p = parts(value);
  return !!p && p.weekday === 0;
}

// "02 Nov 2026"
export function formatTanggalPendek(value) {
  const p = parts(value);
  if (!p) return value ?? "";
  return `${String(p.day).padStart(2, "0")} ${BULAN[p.month]} ${p.year}`;
}

// "Senin, 02 Nov 2026"  (dipakai di export dan tooltip)
export function formatTanggal(value) {
  const p = parts(value);
  if (!p) return value ?? "";
  return `${HARI[p.weekday]}, ${formatTanggalPendek(value)}`;
}

// "Sen 02/11"  (sumbu X grafik)
export function formatTanggalTick(value) {
  const p = parts(value);
  if (!p) return value ?? "";
  return `${HARI_SINGKAT[p.weekday]} ${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}`;
}

// Tanggal lokal "YYYY-MM-DD". Jangan pakai toISOString(): itu memakai UTC, sehingga di WIB
// antara pukul 00:00 dan 07:00 hasilnya mundur satu hari.
export function localISO(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}
