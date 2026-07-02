import { Pool } from 'pg';

let _poolPromise: Promise<Pool> | null = null;
let _pool: Pool | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;

  const host = process.env.NILEDB_HOST || 'us-west-2.db.thenile.dev';
  const port = process.env.NILEDB_PORT || '5432';
  const database = process.env.NILEDB_DATABASE || 'Biasharaledger_App';
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;

  if (!user || !password) {
    throw new Error('Database credentials not configured. Set DATABASE_URL or NILEDB_USER/NILEDB_PASSWORD.');
  }

  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

async function getNilePoolInternal(): Promise<Pool> {
  if (_pool) return _pool;
  if (_poolPromise) return _poolPromise;

  _poolPromise = (async () => {
    const connectionString = getConnectionString();

    _pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
      allowExitOnIdle: false,
    });

    _pool.on('error', (err) => {
      console.error('[nile] Pool error:', err.message);
    });

    return _pool;
  })();

  return _poolPromise;
}

export async function getNileDb(): Promise<Pool> {
  return getNilePoolInternal();
}

export async function getNilePool(): Promise<Pool> {
  return getNilePoolInternal();
}

type TenantRecord = {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
};

export async function createTenant(name: string, metadata: Record<string, unknown> = {}): Promise<TenantRecord> {
  const pool = await getNilePool();
  try {
    const result = await pool.query(
      'INSERT INTO public.tenants (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    const tenant = result?.rows?.[0];
    if (!tenant?.id) {
      throw new Error('Nile tenant creation did not return a tenant id');
    }
    return { ...tenant, metadata };
  } catch (err: any) {
    console.error('[nile] createTenant error:', err.message);
    throw new Error(`Tenant creation failed: ${err.message}`);
  }
}

export async function getTenant(tenantId: string) {
  const pool = await getNilePool();
  try {
    const result = await pool.query('SELECT * FROM public.tenants WHERE id = $1', [tenantId]);
    return result.rows[0] || null;
  } catch (err: any) {
    console.error('[nile] getTenant error:', err.message);
    return null;
  }
}

export function resetPool() {
  _pool = null;
  _poolPromise = null;
}
