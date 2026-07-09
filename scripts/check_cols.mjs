import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='sales_invoices'");
console.log("sales_invoices:", cols.rows.map(c => c.column_name).join(", "));
const pCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='payments'");
console.log("payments:", pCols.rows.map(c => c.column_name).join(", "));
await pool.end();
