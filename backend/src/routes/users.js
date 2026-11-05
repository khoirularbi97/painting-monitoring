import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { MIN_PASSWORD } from "./auth.js";

// Dipasang di index.js dengan requireAuth + requireRole("admin").
const router = Router();

const ROLES = ["admin", "operator"];
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

const COLUMNS = "id, username, nama, role, active, created_at, last_login_at";

async function activeAdminCount(excludeId) {
  const r = await query(
    "SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND active AND id <> COALESCE($1, -1)",
    [excludeId ?? null]
  );
  return r.rows[0].n;
}

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const r = await query(`SELECT ${COLUMNS} FROM users ORDER BY active DESC, LOWER(username)`);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ["Gagal memuat pengguna."] });
  }
});

// POST /api/users { username, nama, password, role }
router.post("/", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const nama = String(req.body?.nama ?? "").trim();
  const password = String(req.body?.password ?? "");
  const role = req.body?.role ?? "operator";

  const errors = [];
  if (!USERNAME_RE.test(username)) errors.push("Username 3-32 karakter: huruf kecil, angka, titik, strip, atau garis bawah.");
  if (!nama || nama.length > 100) errors.push("Nama wajib diisi (maksimal 100 karakter).");
  if (password.length < MIN_PASSWORD) errors.push(`Password minimal ${MIN_PASSWORD} karakter.`);
  if (!ROLES.includes(role)) errors.push("Peran harus admin atau operator.");
  if (errors.length) return res.status(400).json({ errors });

  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await query(
      `INSERT INTO users (username, nama, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING ${COLUMNS}`,
      [username, nama, hash, role]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ errors: ["Username ini sudah dipakai."] });
    console.error(err);
    res.status(500).json({ errors: ["Gagal menambah pengguna."] });
  }
});

// PUT /api/users/:id { nama?, role?, active?, password? }
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errors: ["ID tidak valid."] });

  const { nama, role, active, password } = req.body || {};
  const errors = [];
  if (nama !== undefined && (!String(nama).trim() || String(nama).length > 100)) errors.push("Nama wajib diisi (maksimal 100 karakter).");
  if (role !== undefined && !ROLES.includes(role)) errors.push("Peran harus admin atau operator.");
  if (active !== undefined && typeof active !== "boolean") errors.push("Status aktif harus true atau false.");
  if (password !== undefined && String(password).length < MIN_PASSWORD) errors.push(`Password minimal ${MIN_PASSWORD} karakter.`);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const found = await query("SELECT id, role, active FROM users WHERE id = $1", [id]);
    const target = found.rows[0];
    if (!target) return res.status(404).json({ errors: ["Pengguna tidak ditemukan."] });

    const losesAdmin = target.role === "admin" && target.active && (role === "operator" || active === false);
    if (losesAdmin) {
      if (id === req.user.id) {
        return res.status(400).json({ errors: ["Anda tidak bisa menurunkan atau menonaktifkan akun Anda sendiri."] });
      }
      if ((await activeAdminCount(id)) === 0) {
        return res.status(400).json({ errors: ["Harus ada minimal satu admin aktif."] });
      }
    }

    const sets = [];
    const params = [];
    const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
    if (nama !== undefined) add("nama", String(nama).trim());
    if (role !== undefined) add("role", role);
    if (active !== undefined) add("active", active);
    const kickSessions = password !== undefined || active === false || (role !== undefined && role !== target.role);
    if (password !== undefined) add("password_hash", await bcrypt.hash(String(password), 10));
    if (kickSessions) sets.push("token_version = token_version + 1");
    if (!sets.length) return res.status(400).json({ errors: ["Tidak ada yang diubah."] });

    params.push(id);
    const r = await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING ${COLUMNS}`, params);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ["Gagal mengubah pengguna."] });
  }
});

export default router;
