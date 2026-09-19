-- Master data leader
CREATE TABLE m_leader (
  id SERIAL PRIMARY KEY,
  nama_leader VARCHAR(100) NOT NULL UNIQUE
);

-- Tambah kolom leader_id
ALTER TABLE produksi_painting ADD COLUMN leader_id INTEGER REFERENCES m_leader(id);

-- Migrasi data leader lama (teks bebas) ke master data, lalu hubungkan
INSERT INTO m_leader (nama_leader)
SELECT DISTINCT leader FROM produksi_painting
WHERE leader IS NOT NULL AND leader <> ''
ON CONFLICT (nama_leader) DO NOTHING;

UPDATE produksi_painting p
SET leader_id = m.id
FROM m_leader m
WHERE p.leader = m.nama_leader;

-- Update view DULU (supaya tidak lagi bergantung ke kolom leader lama)
-- PENTING: urutan kolom harus sama seperti view lama, "leader" tetap di posisi
-- paling akhir (persis migration 002) — PostgreSQL tidak izinkan CREATE OR REPLACE
-- VIEW mengubah urutan kolom lama, hanya boleh menambah kolom baru di akhir.
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
  ld.nama_leader AS leader,
  p.leader_id
FROM produksi_painting p
JOIN m_line l ON p.line_id = l.id
JOIN m_shift s ON p.shift_id = s.id
JOIN m_customer c ON p.customer_id = c.id
LEFT JOIN m_leader ld ON p.leader_id = ld.id
LEFT JOIN hasil_repair r ON r.produksi_id = p.id
GROUP BY p.id, p.tanggal, l.nama_line, s.nama_shift, c.nama_customer,
         p.total_part, p.total_ok, p.total_comp, p.total_ng, p.total_hanger,
         ld.nama_leader, p.leader_id;

-- BARU aman hapus kolom teks lama, karena tidak ada lagi yang bergantung padanya
ALTER TABLE produksi_painting DROP COLUMN leader;