import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "odoo_headless",
  user: process.env.DB_USER || "odoo",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "odoo",
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;

export async function query(text: string, params?: unknown[]) {
  const res = await pool.query(text, params);
  return res.rows;
}
