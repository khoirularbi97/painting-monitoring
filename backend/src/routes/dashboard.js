import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// GET /api/dashboard/tren-ok?line_id=&shift_id=&customer_id=&leader_id=&start=&end=
// Mengembalikan %OK awal & %OK final per tanggal, sudah difilter
router.get("/tren-ok", async (req, res) => {
  const { line_id, shift_id, customer_id,leader_id, start, end } = req.query;
  const conditions = [];
  const params = [];

  if (line_id) { params.push(line_id); conditions.push(`p.line_id = $${params.length}`); }
  if (shift_id) { params.push(shift_id); conditions.push(`p.shift_id = $${params.length}`); }
  if (customer_id) { params.push(customer_id); conditions.push(`p.customer_id = $${params.length}`); }
  if (leader_id) { params.push(leader_id); conditions.push(`p.leader_id = $${params.length}`); }
  if (start) { params.push(start); conditions.push(`p.tanggal >= $${params.length}`); }
  if (end) { params.push(end); conditions.push(`p.tanggal <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(`
    SELECT
      p.tanggal,
      SUM(p.total_part) AS total_part,
      SUM(p.total_ok) AS total_ok_awal,
      SUM(p.total_comp) AS total_comp,
      SUM(p.total_ng) AS total_ng_awal,
      COALESCE(SUM(r.total_hasil_ok), 0) AS ok_dari_repair,
      COALESCE(SUM(r.total_hasil_ng), 0) AS ng_dari_repair
    FROM produksi_painting p
    LEFT JOIN hasil_repair r ON r.produksi_id = p.id
    ${where}
    GROUP BY p.tanggal
    ORDER BY p.tanggal
  `, params);

  const rows = result.rows.map((r) => {
    const totalPart = Number(r.total_part) || 0;
    const okAwal = Number(r.total_ok_awal) || 0;
    const okFinal = okAwal + Number(r.ok_dari_repair || 0);
    return {
      tanggal: r.tanggal,
      persen_ok_awal: totalPart ? Math.round((okAwal / totalPart) * 1000) / 10 : 0,
      persen_ok_final: totalPart ? Math.round((okFinal / totalPart) * 1000) / 10 : 0,
      total_part: totalPart,
    };
  });

  res.json(rows);
});

export default router;
