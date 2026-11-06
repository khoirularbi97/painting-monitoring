import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { formatTanggal, isTanggal } from "./format.js";

export const FILE_READY = "export:file-ready";

const MIME = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Aplikasi PWA di HP (terutama iOS) mengabaikan unduhan lewat <a download>. Di layar sentuh,
// file diberikan lewat lembar "Bagikan" bawaan perangkat (Simpan ke Berkas, WhatsApp, dll).
// Lembar itu hanya mau terbuka dari ketukan langsung; export PDF butuh beberapa detik, jadi
// ketukan itu bisa sudah kedaluwarsa. Bila ditolak, file ditahan dan pengguna diminta mengetuk
// tombol "Simpan" (lihat FileReadyBar).
export async function saveFile(blob, filename) {
  const type = MIME[filename.split(".").pop()] || blob.type;
  const file = new File([blob], filename, { type });
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return; // pengguna menutup lembar Bagikan
      window.dispatchEvent(new CustomEvent(FILE_READY, { detail: { file } }));
      return;
    }
  }
  downloadBlob(blob, filename);
}

// Dipanggil dari tombol "Simpan" (ketukan baru, jadi lembar Bagikan boleh terbuka).
export async function shareOrDownload(file) {
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: file.name });
      return true;
    }
  } catch (err) {
    if (err?.name === "AbortError") return false;
  }
  downloadBlob(file, file.name);
  return true;
}

// Kolom berawalan "tanggal" diekspor dengan nama hari: "Senin, 02 Nov 2026".
function cellValue(row, col) {
  const v = row[col.key];
  if (col.key.startsWith("tanggal") && isTanggal(v)) return formatTanggal(v);
  // PostgreSQL mengirim kolom NUMERIC (persen, efisiensi) sebagai teks "90.1". Jadikan angka,
  // karena sel berisi teks diabaikan oleh AVERAGEIFS/SUMIFS di Excel.
  if (typeof v === "string" && /^(persen_|efisiensi|total_|ok_|ng_|comp_)/.test(col.key) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

// Ambil screenshot elemen DOM (mis. div pembungkus chart) jadi data URL PNG,
// untuk ditempel ke PDF. Kembalikan null kalau elemen tidak ada.
export async function captureChartImage(element) {
  if (!element) return null;
  const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
  return canvas.toDataURL("image/png");
}

// Tangkap beberapa elemen sekaligus (chart yang tidak ada di layar dilewati).
// Hasil: [{ data, width, height }] dalam piksel, dipakai exportToPDF agar rasio gambar tetap.
export async function captureCharts(elements) {
  const out = [];
  out.failed = 0;
  for (const el of elements) {
    if (!el) continue;
    // Satu chart gagal tidak boleh menggagalkan seluruh PDF: coba lagi dengan resolusi lebih
    // rendah (layar kecil/memori terbatas), dan bila tetap gagal lewati chart itu.
    let shot = null;
    for (const scale of [2, 1]) {
      try {
        const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale, logging: false });
        shot = { data: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height };
        break;
      } catch (err) {
        console.error("Gagal menangkap chart untuk PDF (scale " + scale + "):", err);
      }
    }
    if (shot) out.push(shot); else out.failed += 1;
  }
  return out;
}

// columns: [{ key: 'tanggal', label: 'Tanggal' }, ...]
// rows: array data mentah (object per baris)

export function exportToExcel(rows, columns, filename, summary, extraSheets) {
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((col) => { obj[col.label] = cellValue(row, col); });
    return obj;
  });
  const workbook = XLSX.utils.book_new();

  if (summary && Array.isArray(summary)) {
    const summaryObj = summary.map((s) => ({ Metric: s.label, Value: s.value }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryObj);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  }

  const sheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  // Lembar tambahan: [{ name, columns, rows }]. Nilai angka dibiarkan angka agar bisa dipakai rumus.
  (extraSheets || []).forEach((sh) => {
    const sheetRows = sh.rows.map((row) => {
      const obj = {};
      sh.columns.forEach((col) => { obj[col.label] = cellValue(row, col); });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(sheetRows.length ? sheetRows : [{}], { header: sh.columns.map((c) => c.label) });
    XLSX.utils.book_append_sheet(workbook, ws, sh.name);
  });
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return saveFile(new Blob([bytes], { type: MIME.xlsx }), `${filename}.xlsx`);
}

export function exportToPDF(rows, columns, filename, title, chartImage, summary) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title || filename, 14, 15);
  doc.setFontSize(9);
  doc.text(`Diekspor: ${new Date().toLocaleString("id-ID")}`, 14, 21);

  let startY = 26;

  // Render summary (if any)
  if (summary && Array.isArray(summary) && summary.length) {
    const leftX = 14;
    let y = startY;
    summary.forEach((s) => {
      doc.text(`${s.label}: ${s.value}`, leftX, y);
      y += 6;
    });
    startY = y + 4;
  }

  // chartImage: satu data URL (lama) atau daftar { data, width, height } dari captureCharts.
  const images = Array.isArray(chartImage) ? chartImage : chartImage ? [{ data: chartImage, width: 180, height: 70 }] : [];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = Math.min(pageW - 28, 160);
  const maxH = pageH - 28;
  images.forEach((img) => {
    // Skala ke lebar halaman, lalu perkecil bila terlalu tinggi; rasio asli dipertahankan.
    const scale = Math.min(maxW / img.width, maxH / img.height, 0.2);
    const w = img.width * scale;
    const h = img.height * scale;
    if (startY + h > pageH - 10) {
      doc.addPage();
      startY = 14;
    }
    doc.addImage(img.data, "JPEG", 14, startY, w, h);
    startY += h + 8;
  });

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => cellValue(row, c) ?? "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 71, 201] },
    alternateRowStyles: { fillColor: [247, 248, 252] },
  });

  return saveFile(doc.output("blob"), `${filename}.pdf`);
}