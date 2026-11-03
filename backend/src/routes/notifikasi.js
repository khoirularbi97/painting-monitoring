import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// GET /api/notifikasi?limit=30 — riwayat input produksi/repair terbaru, yang terbaru di atas
router.get("/", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  try {
    const result = await query(
      "SELECT id, type, title, body, url, created_at FROM notifications ORDER BY id DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    // 42P01 = tabel belum ada (migrasi 005 belum dijalankan): tampilkan daftar kosong, bukan error.
    if (err.code === "42P01") return res.json([]);
    console.error(err);
    res.status(500).json({ errors: ["Gagal memuat notifikasi."] });
  }
});

export default router;
