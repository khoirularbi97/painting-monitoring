import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import masterRoutes from "./routes/master.js";
import produksiRoutes from "./routes/produksi.js";
import repairRoutes from "./routes/repair.js";
import dashboardRoutes from "./routes/dashboard.js";
import pushRoutes from "./routes/push.js";
import notifikasiRoutes from "./routes/notifikasi.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import { requireAuth, requireRole } from "./auth.js";

dotenv.config();

const app = express();
// Di belakang proxy Render: ambil IP klien asli (dipakai pembatas percobaan login).
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Health check ringan: SENGAJA tidak menyentuh database, supaya ping berkala
// (cron-job.org / UptimeRobot) cukup menjaga server Render tetap bangun tanpa
// membangunkan Neon (jatah compute gratis Neon tetap hemat).
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Login adalah satu-satunya endpoint /api yang terbuka. Semua yang di bawahnya wajib login.
app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);

// Hak akses per peran:
//   operator: lihat semua data, input produksi/repair, edit data
//   admin   : semua yang di atas + hapus data, ubah master, kelola pengguna
const adminOnlyWrites = (req, res, next) => (req.method === "GET" ? next() : requireRole("admin")(req, res, next));
const adminOnlyDelete = (req, res, next) => (req.method === "DELETE" ? requireRole("admin")(req, res, next) : next());

app.use("/api/master", adminOnlyWrites, masterRoutes);
app.use("/api/produksi", adminOnlyDelete, produksiRoutes);
app.use("/api/repair", adminOnlyDelete, repairRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/notifikasi", notifikasiRoutes);
app.use("/api/users", requireRole("admin"), userRoutes);




const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
