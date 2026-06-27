import { Pool, QueryResultRow } from 'pg';
import { cookies } from 'next/headers';
import { getSession } from './auth-server';

const pools = new Map<string, Pool>();

function getOrCreatePool(database: string, max = 20): Pool {
  if (!pools.has(database)) {
    pools.set(database, new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }));
    pools.get(database)!.on('error', (err) => {
      console.error(`PostgreSQL pool error [${database}]:`, err.message);
    });
  }
  return pools.get(database)!;
}

export const adminDb = process.env.PGDATABASE || 'biashara_ledger';

const adminPool = getOrCreatePool(adminDb, 20);

export async function getCurrentPool(): Promise<Pool> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bl_session')?.value;
    if (token) {
      const session = await getSession(token);
      if (session && (session as any).client_db) {
        return getOrCreatePool((session as any).client_db, 5);
      }
    }
  } catch {}
  return adminPool;
}

export async function query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = await getCurrentPool();
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function get<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function run(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const pool = await getCurrentPool();
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export async function exec(sql: string): Promise<void> {
  const pool = await getCurrentPool();
  await pool.query(sql);
}

export async function insertReturning<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export function getPoolForDatabase(dbName: string): Pool {
  return getOrCreatePool(dbName, 5);
}

export const adminQuery = async <T extends QueryResultRow = any>(sql: string, params?: any[]) => {
  const result = await adminPool.query<T>(sql, params);
  return result.rows;
};

export const adminGet = async <T extends QueryResultRow = any>(sql: string, params?: any[]) => {
  const rows = await adminQuery<T>(sql, params);
  return rows[0];
};

export const adminRun = async (sql: string, params?: any[]) => {
  const result = await adminPool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
};

export default { query, get, run, exec, insertReturning, adminQuery, adminGet, adminRun, getPoolForDatabase, getCurrentPool };
