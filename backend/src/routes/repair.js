import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const { produksi_id, tanggal_repair, total_comp_diproses, total_hasil_ok, total_hasil_ng } = req.body;

  if (!produksi_id || !tanggal_repair || total_comp_diproses === undefined) {
    return res.status(400).json({ errors: ["Field produksi_id, tanggal_repair, dan total_comp_diproses wajib diisi."] });
  }

  if (Number(total_hasil_ok) + Number(total_hasil_ng) > Number(total_comp_diproses)) {
    return res.status(400).json({
      errors: [`Total hasil OK + NG (${Number(total_hasil_ok) + Number(total_hasil_ng)}) melebihi total compound diproses (${total_comp_diproses}).`],
    });
  }

  // Cek sisa compound yang belum direpair untuk produksi ini
  const sisaResult = await query(
    `SELECT p.total_comp - COALESCE(SUM(r.total_comp_diproses), 0) AS sisa
     FROM produksi_painting p
     LEFT JOIN hasil_repair r ON r.produksi_id = p.id
     WHERE p.id = $1
     GROUP BY p.total_comp`,
    [produksi_id]
  );

  const sisa = sisaResult.rows[0]?.sisa ?? 0;
  if (Number(total_comp_diproses) > Number(sisa)) {
    return res.status(400).json({
      errors: [`Total compound diproses (${total_comp_diproses}) melebihi sisa compound yang belum direpair (${sisa}).`],
    });
  }

  const result = await query(
    `INSERT INTO hasil_repair (produksi_id, tanggal_repair, total_comp_diproses, total_hasil_ok, total_hasil_ng)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [produksi_id, tanggal_repair, total_comp_diproses, total_hasil_ok, total_hasil_ng]
  );

  res.status(201).json(result.rows[0]);
});

// GET /api/repair — daftar semua hasil repair, lengkap dengan info produksi asal
router.get("/", async (req, res) => {
  const result = await query(`
    SELECT r.*, p.tanggal AS tanggal_produksi, l.nama_line, s.nama_shift, c.nama_customer
    FROM hasil_repair r
    JOIN produksi_painting p ON p.id = r.produksi_id
    JOIN m_line l ON p.line_id = l.id
    JOIN m_shift s ON p.shift_id = s.id
    JOIN m_customer c ON p.customer_id = c.id
    ORDER BY r.tanggal_repair DESC, r.id DESC
  `);
  res.json(result.rows);
});

// PUT /api/repair/:id — edit hasil repair
router.put("/:id", async (req, res) => {
  const { tanggal_repair, total_comp_diproses, total_hasil_ok, total_hasil_ng } = req.body;

  if (!tanggal_repair || total_comp_diproses === undefined) {
    return res.status(400).json({ errors: ["Field tanggal_repair dan total_comp_diproses wajib diisi."] });
  }
  if (Number(total_hasil_ok) + Number(total_hasil_ng) > Number(total_comp_diproses)) {
    return res.status(400).json({
      errors: [`Total hasil OK + NG (${Number(total_hasil_ok) + Number(total_hasil_ng)}) melebihi total compound diproses (${total_comp_diproses}).`],
    });
  }

  // Sisa dihitung TANPA menghitung baris ini sendiri, supaya bisa diedit tanpa "mengunci" nilai lama
  const sisaResult = await query(
    `SELECT p.total_comp - COALESCE(SUM(r.total_comp_diproses) FILTER (WHERE r.id != $1), 0) AS sisa
     FROM hasil_repair r0
     JOIN produksi_painting p ON p.id = r0.produksi_id
     LEFT JOIN hasil_repair r ON r.produksi_id = p.id
     WHERE r0.id = $1
     GROUP BY p.total_comp`,
    [req.params.id]
  );

  const sisa = sisaResult.rows[0]?.sisa ?? 0;
  if (Number(total_comp_diproses) > Number(sisa)) {
    return res.status(400).json({
      errors: [`Total compound diproses (${total_comp_diproses}) melebihi sisa compound yang belum direpair (${sisa}).`],
    });
  }

  const result = await query(
    `UPDATE hasil_repair SET
      tanggal_repair=$1, total_comp_diproses=$2, total_hasil_ok=$3, total_hasil_ng=$4
     WHERE id=$5
     RETURNING *`,
    [tanggal_repair, total_comp_diproses, total_hasil_ok, total_hasil_ng, req.params.id]
  );

  if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
  res.json(result.rows[0]);
});

// DELETE /api/repair/:id
router.delete("/:id", async (req, res) => {
  const result = await query("DELETE FROM hasil_repair WHERE id = $1 RETURNING id", [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
  res.json({ deleted: true, id: result.rows[0].id });
});

export default router;