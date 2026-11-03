import { formatTanggalPendek, isMinggu, namaHari } from "../lib/format.js";

// Sel tanggal: tanggal di atas, nama hari kecil di bawahnya.
// Hari Minggu diberi warna merah lembut supaya mudah dikenali.
export default function Tanggal({ value }) {
  if (!value) return <span className="tgl-empty">-</span>;
  return (
    <span className={"tgl" + (isMinggu(value) ? " tgl-minggu" : "")}>
      <span className="tgl-date">{formatTanggalPendek(value)}</span>
      <span className="tgl-day">{namaHari(value)}</span>
    </span>
  );
}
