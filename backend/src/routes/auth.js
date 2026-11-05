import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { authConfigured, loginLimiter, publicUser, requireAuth, signToken } from "../auth.js";

const router = Router();

// Hash palsu: dibandingkan saat username tidak ditemukan, supaya waktu respons
// tidak membocorkan apakah username itu ada.
const DUMMY_HASH = bcrypt.hashSync("tidak-dipakai", 10);

export const MIN_PASSWORD = 8;

// POST /api/auth/login { username, password } -> { token, user }
router.post("/login", async (req, res) => {
  if (!authConfigured) {
    return res.status(503).json({ errors: ["Server belum dikonfigurasi: JWT_SECRET belum diisi."] });
  }

  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!username || !password) {
    return res.status(400).json({ errors: ["Username dan password wajib diisi."] });
  }

  const ip = req.ip;
  const wait = loginLimiter.blockedMinutes(ip, username);
  if (wait > 0) {
    return res.status(429).json({ errors: [`Terlalu banyak percobaan gagal. Coba lagi dalam ${wait} menit.`] });
  }

  try {
    const result = await query(
      "SELECT id, username, nama, role, active, token_version, password_hash FROM users WHERE LOWER(username) = $1",
      [username]
    );
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    // Pesan sama untuk username salah, password salah, dan akun nonaktif.
    if (!user || !user.active || !ok) {
      loginLimiter.fail(ip, username);
      return res.status(401).json({ errors: ["Username atau password salah."] });
    }

    loginLimiter.success(ip, username);
    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === "42P01") {
      return res.status(503).json({ errors: ["Tabel pengguna belum ada. Jalankan migrasi 006_users.sql."] });
    }
    console.error(err);
    res.status(500).json({ errors: ["Gagal memproses login."] });
  }
});

// GET /api/auth/me — dipakai frontend untuk memastikan sesi masih berlaku
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password { current_password, new_password }
// Semua sesi lain ikut berakhir; perangkat ini menerima token baru.
router.post("/change-password", requireAuth, async (req, res) => {
  const current = String(req.body?.current_password ?? "");
  const next = String(req.body?.new_password ?? "");

  if (next.length < MIN_PASSWORD) {
    return res.status(400).json({ errors: [`Password baru minimal ${MIN_PASSWORD} karakter.`] });
  }
  if (next === current) {
    return res.status(400).json({ errors: ["Password baru harus berbeda dari password lama."] });
  }

  try {
    const result = await query("SELECT id, password_hash FROM users WHERE id = $1", [req.user.id]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(current, row.password_hash))) {
      return res.status(400).json({ errors: ["Password lama salah."] });
    }

    const hash = await bcrypt.hash(next, 10);
    const updated = await query(
      `UPDATE users SET password_hash = $1, token_version = token_version + 1
       WHERE id = $2 RETURNING id, username, nama, role, token_version`,
      [hash, req.user.id]
    );
    res.json({ token: signToken(updated.rows[0]), user: publicUser(updated.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ["Gagal mengganti password."] });
  }
});

export default router;
