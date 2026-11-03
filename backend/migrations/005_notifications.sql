-- Riwayat notifikasi untuk panel lonceng di aplikasi (terpisah dari langganan push).
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,          -- 'produksi' | 'repair'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT,
  ref_id      INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
