-- Master data
CREATE TABLE m_line (
  id SERIAL PRIMARY KEY,
  nama_line VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE m_shift (
  id SERIAL PRIMARY KEY,
  nama_shift VARCHAR(20) NOT NULL UNIQUE,
  jam_mulai TIME,
  jam_selesai TIME
);

CREATE TABLE m_customer (
  id SERIAL PRIMARY KEY,
  nama_customer VARCHAR(50) NOT NULL UNIQUE
);

-- Data produksi per shift
CREATE TABLE produksi_painting (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  line_id INTEGER NOT NULL REFERENCES m_line(id),
  shift_id INTEGER NOT NULL REFERENCES m_shift(id),
  customer_id INTEGER NOT NULL REFERENCES m_customer(id),
  total_part INTEGER NOT NULL CHECK (total_part >= 0),
  total_ok INTEGER NOT NULL CHECK (total_ok >= 0),
  total_comp INTEGER NOT NULL CHECK (total_comp >= 0),
  total_ng INTEGER NOT NULL CHECK (total_ng >= 0),
  total_hanger INTEGER NOT NULL CHECK (total_hanger >= 0),
  input_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tanggal, line_id, shift_id, customer_id),
  CHECK (total_ok + total_comp + total_ng <= total_part)
);

-- Hasil repair compound (bisa bertahap, banyak baris per produksi)
CREATE TABLE hasil_repair (
  id SERIAL PRIMARY KEY,
  produksi_id INTEGER NOT NULL REFERENCES produksi_painting(id),
  tanggal_repair DATE NOT NULL,
  total_comp_diproses INTEGER NOT NULL CHECK (total_comp_diproses >= 0),
  total_hasil_ok INTEGER NOT NULL CHECK (total_hasil_ok >= 0),
  total_hasil_ng INTEGER NOT NULL CHECK (total_hasil_ng >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (total_hasil_ok + total_hasil_ng <= total_comp_diproses)
);

-- View gabungan hasil final (setelah repair)
CREATE VIEW v_produksi_final AS
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
  ROUND(p.total_part::numeric / NULLIF(p.total_hanger,0), 2) AS efisiensi_hanger
FROM produksi_painting p
JOIN m_line l ON p.line_id = l.id
JOIN m_shift s ON p.shift_id = s.id
JOIN m_customer c ON p.customer_id = c.id
LEFT JOIN hasil_repair r ON r.produksi_id = p.id
GROUP BY p.id, p.tanggal, l.nama_line, s.nama_shift, c.nama_customer,
         p.total_part, p.total_ok, p.total_comp, p.total_ng, p.total_hanger;

-- Seed master data
INSERT INTO m_line (nama_line) VALUES ('Line 1'), ('Line 2');
INSERT INTO m_shift (nama_shift, jam_mulai, jam_selesai) VALUES
  ('Shift 1', '06:00', '14:00'),
  ('Shift 2', '14:00', '22:00');
INSERT INTO m_customer (nama_customer) VALUES ('AHM'), ('YAMAHA');
