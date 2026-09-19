import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Ambil screenshot elemen DOM (mis. div pembungkus chart) jadi data URL PNG,
// untuk ditempel ke PDF. Kembalikan null kalau elemen tidak ada.
export async function captureChartImage(element) {
  if (!element) return null;
  const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
  return canvas.toDataURL("image/png");
}

// columns: [{ key: 'tanggal', label: 'Tanggal' }, ...]
// rows: array data mentah (object per baris)

export function exportToExcel(rows, columns, filename) {
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((col) => { obj[col.label] = row[col.key]; });
    return obj;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(rows, columns, filename, title, chartImage) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title || filename, 14, 15);
  doc.setFontSize(9);
  doc.text(`Diekspor: ${new Date().toLocaleString("id-ID")}`, 14, 21);

  let startY = 26;
  if (chartImage) {
    const imgWidth = 180;
    const imgHeight = 70;
    doc.addImage(chartImage, "PNG", 14, startY, imgWidth, imgHeight);
    startY += imgHeight + 8;
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [47, 102, 144] },
  });

  doc.save(`${filename}.pdf`);
}