import { Pool, QueryResultRow } from 'pg';
import { cookies } from 'next/headers';
import { getSession } from './auth-server';

const pools = new Map<string, Pool>();

function getOrCreatePool(max = 20, schema?: string): Pool {
  const key = schema || '__admin__';
  if (!pools.has(key)) {
    let connectionString = process.env.DATABASE_URL!;
    if (schema) {
      const sep = connectionString.includes('?') ? '&' : '?';
      const escaped = `"${schema.replace(/"/g, '""')}"`;
      connectionString += `${sep}options=--search_path%3D${encodeURIComponent(escaped)}`;
    }
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error(`PostgreSQL pool error [${key}]:`, err.message);
    });

    pools.set(key, pool);
  }
  return pools.get(key)!;
}

const adminPool = getOrCreatePool(20);

export async function getCurrentPool(): Promise<Pool> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bl_session')?.value;
    if (token) {
      const session = await getSession(token);
      if (session && (session as any).client_db) {
        return getOrCreatePool(5, (session as any).client_db);
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

export function getPoolForDatabase(schemaName: string): Pool {
  return getOrCreatePool(5, schemaName);
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
