import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import masterRoutes from "./routes/master.js";
import produksiRoutes from "./routes/produksi.js";
import repairRoutes from "./routes/repair.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/master", masterRoutes);
app.use("/api/produksi", produksiRoutes);
app.use("/api/repair", repairRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
