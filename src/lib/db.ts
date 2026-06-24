import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'biashara_ledger',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export async function query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function get<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function run(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export async function exec(sql: string): Promise<void> {
  await pool.query(sql);
}

export async function insertReturning<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export default { query, get, run, exec, insertReturning, pool };
