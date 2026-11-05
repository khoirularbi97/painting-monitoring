import jwt from "jsonwebtoken";
import { query } from "./db.js";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "14d";

// Rahasia pendek mudah ditebak: tolak, jangan diam-diam pakai nilai lemah.
export const authConfigured = Boolean(SECRET && SECRET.length >= 32);
if (!authConfigured) {
  console.error("JWT_SECRET belum diisi atau kurang dari 32 karakter. Semua endpoint /api (selain login) akan ditolak sampai diisi.");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, tv: user.token_version }, SECRET, { algorithm: "HS256", expiresIn: EXPIRES_IN });
}

export function publicUser(u) {
  return { id: u.id, username: u.username, nama: u.nama, role: u.role };
}

const unauthorized = (res, msg = "Sesi berakhir. Silakan login kembali.") =>
  res.status(401).json({ errors: [msg] });

// Wajib login. Token dicek ke database di setiap permintaan, sehingga akun yang dinonaktifkan
// atau passwordnya diganti langsung kehilangan akses, tanpa menunggu token kedaluwarsa.
export async function requireAuth(req, res, next) {
  if (!authConfigured) {
    return res.status(503).json({ errors: ["Server belum dikonfigurasi: JWT_SECRET belum diisi."] });
  }

  const match = (req.get("authorization") || "").match(/^Bearer (.+)$/i);
  if (!match) return unauthorized(res, "Silakan login terlebih dahulu.");

  let payload;
  try {
    payload = jwt.verify(match[1], SECRET, { algorithms: ["HS256"] });
  } catch {
    return unauthorized(res);
  }

  try {
    const result = await query(
      "SELECT id, username, nama, role, active, token_version FROM users WHERE id = $1",
      [payload.sub]
    );
    const user = result.rows[0];
    if (!user || !user.active || user.token_version !== payload.tv) return unauthorized(res);
    req.user = publicUser(user);
    next();
  } catch (err) {
    if (err.code === "42P01") {
      return res.status(503).json({ errors: ["Tabel pengguna belum ada. Jalankan migrasi 006_users.sql."] });
    }
    console.error(err);
    res.status(500).json({ errors: ["Gagal memeriksa sesi."] });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ errors: ["Anda tidak punya izin untuk tindakan ini."] });

// Pembatas percobaan login (di memori, cukup untuk satu instance server).
// 5 kegagalan untuk kombinasi IP + username, atau 20 kegagalan dari satu IP, mengunci 15 menit.
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map();

function bucket(key) {
  const now = Date.now();
  const b = fails.get(key);
  if (!b || now - b.first > WINDOW_MS) {
    const fresh = { count: 0, first: now };
    fails.set(key, fresh);
    return fresh;
  }
  return b;
}

export const loginLimiter = {
  // Mengembalikan sisa menit terkunci, atau 0 bila boleh mencoba.
  blockedMinutes(ip, username) {
    const checks = [[`u|${ip}|${username}`, 5], [`ip|${ip}`, 20]];
    let wait = 0;
    for (const [key, max] of checks) {
      const b = bucket(key);
      if (b.count >= max) wait = Math.max(wait, Math.ceil((b.first + WINDOW_MS - Date.now()) / 60000));
    }
    return wait;
  },
  fail(ip, username) {
    bucket(`u|${ip}|${username}`).count += 1;
    bucket(`ip|${ip}`).count += 1;
  },
  success(ip, username) {
    fails.delete(`u|${ip}|${username}`);
  },
};

// Bersihkan catatan lama supaya Map tidak membesar terus.
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of fails) if (now - b.first > WINDOW_MS) fails.delete(k);
}, WINDOW_MS).unref();
