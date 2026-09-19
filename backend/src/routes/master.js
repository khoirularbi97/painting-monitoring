import { Router } from "express";
import { query } from "../db.js";

const router = Router();

function friendlyDbError(err, entityName) {
  if (err.code === "23505") return `${entityName} dengan nama ini sudah ada.`;
  if (err.code === "23503") return `${entityName} ini masih dipakai di data produksi, tidak bisa dihapus.`;
  console.error(err);
  return `Gagal memproses ${entityName.toLowerCase()}.`;
}

// ===== Line =====
router.get("/line", async (req, res) => {
  const result = await query("SELECT id, nama_line FROM m_line ORDER BY id");
  res.json(result.rows);
});

router.post("/line", async (req, res) => {
  const { nama_line } = req.body;
  if (!nama_line) return res.status(400).json({ errors: ["Nama line wajib diisi."] });
  try {
    const result = await query(
      "INSERT INTO m_line (nama_line) VALUES ($1) RETURNING *",
      [nama_line]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Line")] });
  }
});

router.put("/line/:id", async (req, res) => {
  const { nama_line } = req.body;
  if (!nama_line) return res.status(400).json({ errors: ["Nama line wajib diisi."] });
  try {
    const result = await query(
      "UPDATE m_line SET nama_line = $1 WHERE id = $2 RETURNING *",
      [nama_line, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Line")] });
  }
});

router.delete("/line/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM m_line WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Line")] });
  }
});

// ===== Shift =====
router.get("/shift", async (req, res) => {
  const result = await query("SELECT id, nama_shift, jam_mulai, jam_selesai FROM m_shift ORDER BY id");
  res.json(result.rows);
});

router.post("/shift", async (req, res) => {
  const { nama_shift, jam_mulai, jam_selesai } = req.body;
  if (!nama_shift) return res.status(400).json({ errors: ["Nama shift wajib diisi."] });
  try {
    const result = await query(
      "INSERT INTO m_shift (nama_shift, jam_mulai, jam_selesai) VALUES ($1,$2,$3) RETURNING *",
      [nama_shift, jam_mulai || null, jam_selesai || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Shift")] });
  }
});

router.put("/shift/:id", async (req, res) => {
  const { nama_shift, jam_mulai, jam_selesai } = req.body;
  if (!nama_shift) return res.status(400).json({ errors: ["Nama shift wajib diisi."] });
  try {
    const result = await query(
      "UPDATE m_shift SET nama_shift=$1, jam_mulai=$2, jam_selesai=$3 WHERE id=$4 RETURNING *",
      [nama_shift, jam_mulai || null, jam_selesai || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Shift")] });
  }
});

router.delete("/shift/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM m_shift WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Shift")] });
  }
});

// ===== Customer =====
router.get("/customer", async (req, res) => {
  const result = await query("SELECT id, nama_customer FROM m_customer ORDER BY id");
  res.json(result.rows);
});

router.post("/customer", async (req, res) => {
  const { nama_customer } = req.body;
  if (!nama_customer) return res.status(400).json({ errors: ["Nama customer wajib diisi."] });
  try {
    const result = await query(
      "INSERT INTO m_customer (nama_customer) VALUES ($1) RETURNING *",
      [nama_customer]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Customer")] });
  }
});

router.put("/customer/:id", async (req, res) => {
  const { nama_customer } = req.body;
  if (!nama_customer) return res.status(400).json({ errors: ["Nama customer wajib diisi."] });
  try {
    const result = await query(
      "UPDATE m_customer SET nama_customer = $1 WHERE id = $2 RETURNING *",
      [nama_customer, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Customer")] });
  }
});

router.delete("/customer/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM m_customer WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Customer")] });
  }
});

// ===== Leader =====
router.get("/leader", async (req, res) => {
  const result = await query("SELECT id, nama_leader FROM m_leader ORDER BY nama_leader");
  res.json(result.rows);
});

router.post("/leader", async (req, res) => {
  const { nama_leader } = req.body;
  if (!nama_leader) return res.status(400).json({ errors: ["Nama leader wajib diisi."] });
  try {
    const result = await query(
      "INSERT INTO m_leader (nama_leader) VALUES ($1) RETURNING *",
      [nama_leader]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Leader")] });
  }
});

router.put("/leader/:id", async (req, res) => {
  const { nama_leader } = req.body;
  if (!nama_leader) return res.status(400).json({ errors: ["Nama leader wajib diisi."] });
  try {
    const result = await query(
      "UPDATE m_leader SET nama_leader = $1 WHERE id = $2 RETURNING *",
      [nama_leader, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Leader")] });
  }
});

router.delete("/leader/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM m_leader WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ errors: ["Data tidak ditemukan."] });
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ errors: [friendlyDbError(err, "Leader")] });
  }
});

export default router;