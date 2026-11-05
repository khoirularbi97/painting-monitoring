-- Pengguna aplikasi. Peran: 'admin' (semua fitur) dan 'operator' (input dan lihat data).
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL,
  nama           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  -- Dinaikkan saat password diganti/direset, sehingga semua token lama otomatis tidak berlaku.
  token_version  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);

-- Username tidak membedakan huruf besar/kecil.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));
