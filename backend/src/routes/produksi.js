import { Router } from "express";
import { query } from "../db.js";

const router = Router();

function validatePayload(body) {
  const errors = [];
  const required = [
    "tanggal", "line_id", "shift_id", "customer_id",
    "total_part", "total_ok", "total_comp", "total_ng", "total_hanger",
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      errors.push(`Field ${field} wajib diisi.`);
    }
  }
  if (errors.length) return errors;

  const numericFields = ["total_part", "total_ok", "total_comp", "total_ng", "total_hanger"];
  for (const field of numericFields) {
    if (Number(body[field]) < 0) {
      errors.push(`Field ${field} tidak boleh negatif.`);
    }
  }

  const sisa = Number(body.total_ok) + Number(body.total_comp) + Number(body.total_ng);
  if (sisa > Number(body.total_part)) {
    errors.push(
      `Total OK + Compound + NG (${sisa}) melebihi total part (${body.total_part}).`
    );
  }

  return errors;
}

// GET /api/produksi?line_id=&shift_id=&customer_id=&start=&end=
router.get("/", async (req, res) => {
  const { line_id, shift_id, customer_id, start, end } = req.query;
  const conditions = [];
  const params = [];

  if (line_id) { params.push(line_id); conditions.push(`nama_line = (SELECT nama_line FROM m_line WHERE id = $${params.length})`); }
  if (shift_id) { params.push(shift_id); conditions.push(`nama_shift = (SELECT nama_shift FROM m_shift WHERE id = $${params.length})`); }
  if (customer_id) { params.push(customer_id); conditions.push(`nama_customer = (SELECT nama_customer FROM m_customer WHERE id = $${params.length})`); }
  if (start) { params.push(start); conditions.push(`tanggal >= $${params.length}`); }
  if (end) { params.push(end); conditions.push(`tanggal <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT * FROM v_produksi_final ${where} ORDER BY tanggal DESC, produksi_id DESC`,
    params
  );
  res.json(result.rows);
});

// POST /api/produksi
router.post("/", async (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const {
    tanggal, line_id, shift_id, customer_id,
    total_part, total_ok, total_comp, total_ng, total_hanger,
    input_by,
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO produksi_painting
        (tanggal, line_id, shift_id, customer_id, total_part, total_ok, total_comp, total_ng, total_hanger, input_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [tanggal, line_id, shift_id, customer_id, total_part, total_ok, total_comp, total_ng, total_hanger, input_by || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        errors: ["Data untuk kombinasi tanggal, line, shift, dan customer ini sudah pernah diinput. Gunakan mode edit."],
      });
    }
    console.error(err);
    res.status(500).json({ errors: ["Gagal menyimpan data."] });
  }
});

// PUT /api/produksi/:id
router.put("/:id", async (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const {
    tanggal, line_id, shift_id, customer_id,
    total_part, total_ok, total_comp, total_ng, total_hanger,
  } = req.body;

  const result = await query(
    `UPDATE produksi_painting SET
      tanggal=$1, line_id=$2, shift_id=$3, customer_id=$4,
      total_part=$5, total_ok=$6, total_comp=$7, total_ng=$8, total_hanger=$9,
      updated_at=NOW()
     WHERE id=$10
     RETURNING *`,
    [tanggal, line_id, shift_id, customer_id, total_part, total_ok, total_comp, total_ng, total_hanger, req.params.id]
  );

  if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
  res.json(result.rows[0]);
});

// GET /api/produksi/menunggu-repair — daftar produksi yang punya sisa compound belum direpair
router.get("/menunggu-repair", async (req, res) => {
  const result = await query(`
    SELECT p.id AS produksi_id, p.tanggal, l.nama_line, s.nama_shift, c.nama_customer,
           p.total_comp,
           COALESCE(SUM(r.total_comp_diproses), 0) AS sudah_diproses,
           p.total_comp - COALESCE(SUM(r.total_comp_diproses), 0) AS sisa_belum_repair
    FROM produksi_painting p
    JOIN m_line l ON p.line_id = l.id
    JOIN m_shift s ON p.shift_id = s.id
    JOIN m_customer c ON p.customer_id = c.id
    LEFT JOIN hasil_repair r ON r.produksi_id = p.id
    WHERE p.total_comp > 0
    GROUP BY p.id, p.tanggal, l.nama_line, s.nama_shift, c.nama_customer, p.total_comp
    HAVING p.total_comp - COALESCE(SUM(r.total_comp_diproses), 0) > 0
    ORDER BY p.tanggal DESC
  `);
  res.json(result.rows);
});

export default router;
