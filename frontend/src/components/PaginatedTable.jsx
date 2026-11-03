import { useEffect, useMemo, useState } from "react";
import { formatTanggal, isTanggal } from "../lib/format.js";

export default function PaginatedTable({
  rows = [],
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  searchable = false,
  searchKeys = [],
  searchPlaceholder = "Cari...",
  children,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchable || !searchKeys.length || !searchTerm.trim()) return rows;

    const query = searchTerm.trim().toLowerCase();

    return rows.filter((row) =>
      searchKeys.some((key) => {
        const value = key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), row);
        // Kolom tanggal ikut dicari lewat nama hari dan nama bulan ("senin", "nov").
        const text = isTanggal(value) ? `${value} ${formatTanggal(value)}` : String(value ?? "");
        return text.toLowerCase().includes(query);
      })
    );
  }, [rows, searchable, searchKeys, searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRows.length / pageSize)), [filteredRows.length, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const start = (page - 1) * pageSize;
  const currentRows = filteredRows.slice(start, start + pageSize);
  const from = filteredRows.length ? start + 1 : 0;
  const to = Math.min(start + pageSize, filteredRows.length);

  return (
    <div className="ptable">
      {searchable && (
        <div className="ptable-search">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Cari data"
          />
        </div>
      )}

      <div className="table-wrap">{children(currentRows)}</div>

      {filteredRows.length === 0 && searchTerm.trim() && (
        <p className="empty-note">Tidak ada data yang cocok dengan “{searchTerm.trim()}”.</p>
      )}

      <div className="ptable-footer">
        <span className="ptable-count">
          {from}–{to} dari {filteredRows.length.toLocaleString("id-ID")} data
        </span>

        <div className="ptable-nav">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Halaman pertama">«</button>
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Halaman sebelumnya">‹</button>
          <span className="page-info">Halaman {page} dari {totalPages}</span>
          <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Halaman berikutnya">›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Halaman terakhir">»</button>
        </div>

        <label className="ptable-size">
          <span>Baris</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
