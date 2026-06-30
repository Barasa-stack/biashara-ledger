import { Pool, QueryResultRow } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

const tenantPools = new Map<string, Pool>();
const tenantContext = new AsyncLocalStorage<string | null>();

function getConnectionString() {
  return process.env.DATABASE_URL || '';
}

async function getTenantPool(tenantId: string): Promise<Pool> {
  const cached = tenantPools.get(tenantId);
  if (cached) return cached;

  const pool = new Pool({
    connectionString: getConnectionString(),
    max: 5,
    idleTimeoutMillis: 30000,
    onConnect: async (client: any) => {
      try {
        await client.query(`SET nile.tenant_id = '${tenantId.replace(/'/g, "''")}'`);
      } catch (e: any) {
        console.error(`[db] onConnect error for tenant ${tenantId.substring(0,8)}: ${e.message}`);
      }
    },
  } as any);

  pool.on('error', (err) => {
    console.error(`PostgreSQL pool error [tenant:${tenantId}]:`, err.message);
  });

  tenantPools.set(tenantId, pool);
  return pool;
}

let _basePool: Pool | null = null;

async function getBasePool(): Promise<Pool> {
  if (_basePool) return _basePool;
  const { getNileDb } = await import('./nile');
  const db = await getNileDb();
  _basePool = db as unknown as Pool;
  return _basePool;
}

/**
 * Use withTenantContext() instead. This function uses enterWith() which
 * does NOT properly scope tenant IDs across concurrent requests.
 * @deprecated
 */
export function setTenantContext(tenantId: string) {
  tenantContext.enterWith(tenantId);
}

/**
 * @deprecated Use withTenantContext() instead.
 */
export function clearTenantContext() {
  tenantContext.enterWith(null);
}

/**
 * Wraps an async function in a scoped tenant context using AsyncLocalStorage.run().
 * This properly isolates tenant IDs across concurrent requests.
 */
export async function withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(tenantId, fn);
}

export async function withoutTenantContext<T>(fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(null, fn);
}

export function getTenantContext(): string | null {
  return tenantContext.getStore() ?? null;
}

export async function query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T[]> {
  const currentTenantId = getTenantContext();
  if (currentTenantId) {
    const pool = await getTenantPool(currentTenantId);
    const result = await pool.query<T>(sql, params);
    return result.rows;
  }
  const pool = await getBasePool();
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function adminQuery<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = await getBasePool();
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function get<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function adminGet<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const rows = await adminQuery<T>(sql, params);
  return rows[0];
}

export async function run(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const currentTenantId = getTenantContext();
  if (currentTenantId) {
    const pool = await getTenantPool(currentTenantId);
    const result = await pool.query(sql, params);
    return { rowCount: result.rowCount ?? 0 };
  }
  const pool = await getBasePool();
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export async function adminRun(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const pool = await getBasePool();
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export async function exec(sql: string): Promise<void> {
  const currentTenantId = getTenantContext();
  if (currentTenantId) {
    const pool = await getTenantPool(currentTenantId);
    await pool.query(sql);
  } else {
    const pool = await getBasePool();
    await pool.query(sql);
  }
}

export async function insertReturning<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export function getOrCreatePool(_max?: number, _schema?: string) {
  return getBasePool();
}

export function getPoolForDatabase(_dbName?: string) {
  return getBasePool();
}

export async function getCurrentPool() {
  return getBasePool();
}

export default {
  query,
  get,
  run,
  exec,
  insertReturning,
  adminQuery,
  adminGet,
  adminRun,
  setTenantContext,
  clearTenantContext,
  withTenantContext,
  withoutTenantContext,
  getTenantContext,
};
