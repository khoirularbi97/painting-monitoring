import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import masterRoutes from "./routes/master.js";
import produksiRoutes from "./routes/produksi.js";
import repairRoutes from "./routes/repair.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Health check ringan: SENGAJA tidak menyentuh database, supaya ping berkala
// (cron-job.org / UptimeRobot) cukup menjaga server Render tetap bangun tanpa
// membangunkan Neon (jatah compute gratis Neon tetap hemat).
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/master", masterRoutes);
app.use("/api/produksi", produksiRoutes);
app.use("/api/repair", repairRoutes);
app.use("/api/dashboard", dashboardRoutes);




const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
