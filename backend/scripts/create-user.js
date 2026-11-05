// Membuat (atau mereset) pengguna lewat terminal. Dipakai untuk admin pertama, karena
// aplikasi tidak punya halaman pendaftaran.
//
//   node scripts/create-user.js <username> <password> [admin|operator] [nama lengkap]
//
// Jalankan dari folder backend dengan DATABASE_URL di .env menunjuk ke database tujuan.
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const [username, password, role = "admin", ...namaParts] = process.argv.slice(2);
const nama = namaParts.join(" ") || username;

async function main() {
  if (!username || !password) {
    console.error("Pemakaian: node scripts/create-user.js <username> <password> [admin|operator] [nama lengkap]");
    process.exitCode = 1;
    return;
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username.toLowerCase())) {
    console.error("Username 3-32 karakter: huruf, angka, titik, strip, atau garis bawah.");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exitCode = 1;
    return;
  }
  if (!["admin", "operator"].includes(role)) {
    console.error("Peran harus admin atau operator.");
    process.exitCode = 1;
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (username, nama, password_hash, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (LOWER(username)) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, nama = EXCLUDED.nama,
             active = TRUE, token_version = users.token_version + 1
       RETURNING id, username, role, (xmax = 0) AS dibuat_baru`,
      [username.toLowerCase(), nama, hash, role]
    );
    const u = r.rows[0];
    console.log(`${u.dibuat_baru ? "Pengguna dibuat" : "Pengguna diperbarui (password direset)"}: ${u.username} (${u.role})`);
  } catch (err) {
    console.error("Gagal:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
