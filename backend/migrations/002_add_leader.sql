ALTER TABLE produksi_painting ADD COLUMN leader VARCHAR(100);

CREATE OR REPLACE VIEW v_produksi_final AS
SELECT
  p.id AS produksi_id, p.tanggal,
  l.nama_line, s.nama_shift, c.nama_customer,
  p.total_part,
  p.total_ok AS ok_awal,
  p.total_comp,
  p.total_ng AS ng_awal,
  COALESCE(SUM(r.total_hasil_ok), 0) AS ok_dari_repair,
  COALESCE(SUM(r.total_hasil_ng), 0) AS ng_dari_repair,
  p.total_ok + COALESCE(SUM(r.total_hasil_ok), 0) AS total_ok_final,
  p.total_ng + COALESCE(SUM(r.total_hasil_ng), 0) AS total_ng_final,
  ROUND((p.total_ok + COALESCE(SUM(r.total_hasil_ok), 0))::numeric
        / NULLIF(p.total_part,0) * 100, 1) AS persen_ok_final,
  ROUND((p.total_ng + COALESCE(SUM(r.total_hasil_ng), 0))::numeric
        / NULLIF(p.total_part,0) * 100, 1) AS persen_ng_final,
  p.total_hanger,
  ROUND(p.total_part::numeric / NULLIF(p.total_hanger,0), 2) AS efisiensi_hanger,
  p.leader
FROM produksi_painting p
JOIN m_line l ON p.line_id = l.id
JOIN m_shift s ON p.shift_id = s.id
JOIN m_customer c ON p.customer_id = c.id
LEFT JOIN hasil_repair r ON r.produksi_id = p.id
GROUP BY p.id, p.tanggal, l.nama_line, s.nama_shift, c.nama_customer,
         p.total_part, p.total_ok, p.total_comp, p.total_ng, p.total_hanger, p.leader;