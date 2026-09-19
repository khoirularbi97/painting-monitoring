import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export function exportToPDF(rows, columns, filename, title) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title || filename, 14, 15);
  doc.setFontSize(9);
  doc.text(`Diekspor: ${new Date().toLocaleString("id-ID")}`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [47, 102, 144] },
  });

  doc.save(`${filename}.pdf`);
}