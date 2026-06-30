import { Pool } from 'pg';

type NileInstance = {
  db: {
    query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
  };
  tenants: {
    get: (id: string) => Promise<any>;
  };
};

let _nile: NileInstance | null = null;
let _fallbackPool: Pool | null = null;

function getFallbackPool(): Pool {
  if (_fallbackPool) return _fallbackPool;
  _fallbackPool = new Pool({
    connectionString: process.env.DATABASE_URL || '',
    max: 5,
    idleTimeoutMillis: 30000,
  });
  _fallbackPool.on('error', (err) => {
    console.error('[nile] Fallback pool error:', err.message);
  });
  return _fallbackPool;
}

function createFallbackNile(): NileInstance {
  const pool = getFallbackPool();
  return {
    db: {
      query: async (sql: string, params?: any[]) => {
        const result = await pool.query(sql, params);
        return { rows: result.rows };
      },
    },
    tenants: {
      get: async (id: string) => {
        const result = await pool.query('SELECT * FROM public.tenants WHERE id = $1', [id]);
        return result.rows[0] || null;
      },
    },
  };
}

async function getNile(): Promise<NileInstance> {
  if (_nile) return _nile;

  // Always use direct DATABASE_URL connection — Nile SDK cloud
  // API endpoint is not enabled for this database instance.
  console.info('[nile] Using DATABASE_URL directly (Nile cloud API not available)');
  _nile = createFallbackNile();
  return _nile;
}

export async function getNileDb() {
  const nile = await getNile();
  return nile.db;
}

export async function getNileTenants() {
  const nile = await getNile();
  return nile.tenants;
}

type TenantRecord = {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
};

export async function createTenant(name: string, metadata: Record<string, unknown> = {}): Promise<TenantRecord> {
  const nile = await getNile();
  let result;
  try {
    result = await nile.db.query(
      'INSERT INTO public.tenants (name) VALUES ($1) RETURNING id, name',
      [name]
    );
  } catch (err: any) {
    console.error('createTenant SQL error:', err.message);
    throw new Error(`Tenant creation failed: ${err.message}`);
  }
  const tenant = result?.rows?.[0];
  if (!tenant?.id) {
    throw new Error('Nile tenant creation did not return a tenant id');
  }
  return { ...tenant, metadata };
}

export async function getTenant(tenantId: string) {
  const nile = await getNile();
  return nile.tenants.get(tenantId);
}
