import { useEffect, useMemo, useState } from "react";

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
        return String(value ?? "").toLowerCase().includes(query);
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

  return (
    <div>
      {searchable && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%",
              maxWidth: 260,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--panel)",
              color: "var(--ink)",
            }}
          />
        </div>
      )}

      {children(currentRows)}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => setPage(1)} disabled={page === 1}>⏮</button>
          <button className="btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
          <span style={{ fontSize: 13 }}>Halaman {page} / {totalPages}</span>
          <button className="btn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
          <button className="btn-ghost" onClick={() => setPage(totalPages)} disabled={page === totalPages}>⏭</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>Tampilkan</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
