import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const file = process.argv[2] || "migrations/001_init.sql";
  const sql = fs.readFileSync(path.join(__dirname, file), "utf-8");

  console.log(`Menjalankan migrasi: ${file}`);
  try {
    await pool.query(sql);
    console.log("Migrasi berhasil.");
  } catch (err) {
    console.error("Migrasi gagal:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();