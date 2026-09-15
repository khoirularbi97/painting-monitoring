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

export default router;
