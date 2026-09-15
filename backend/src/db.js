import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pg;

// OID 1082 = tipe DATE di PostgreSQL. Default-nya pg mengubahnya jadi objek Date
// (yang lalu ter-serialize ke JSON sebagai "2026-09-14T00:00:00.000Z").
// Ini membuatnya tetap string "2026-09-14" apa adanya.
types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export async function query(text, params) {
  return pool.query(text, params);
}