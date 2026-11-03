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

// "baru saja", "5 menit lalu", "3 jam lalu", selebihnya "02 Nov 2026, 14:30"
export function waktuRelatif(isoString, now = Date.now()) {
  const t = new Date(isoString);
  if (Number.isNaN(t.getTime())) return "";
  const detik = Math.max(0, Math.floor((now - t.getTime()) / 1000));
  if (detik < 60) return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  const jam = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  return `${formatTanggalPendek(localISO(t))}, ${jam}`;
}
