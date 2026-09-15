import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/line", async (req, res) => {
  const result = await query("SELECT id, nama_line FROM m_line ORDER BY id");
  res.json(result.rows);
});

router.get("/shift", async (req, res) => {
  const result = await query("SELECT id, nama_shift, jam_mulai, jam_selesai FROM m_shift ORDER BY id");
  res.json(result.rows);
});

router.get("/customer", async (req, res) => {
  const result = await query("SELECT id, nama_customer FROM m_customer ORDER BY id");
  res.json(result.rows);
});

export default router;
