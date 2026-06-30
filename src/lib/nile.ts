import { Pool } from 'pg';

let _pool: Pool | null = null;

function getNilePool(): Pool {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Configure it in .env.local using your Nile ' +
      'PostgreSQL connection string:\n' +
      'postgres://NILEDB_USER:NILEDB_PASSWORD@us-west-2.db.thenile.dev:5432/Biasharaledger_App?sslmode=require'
    );
  }

  _pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  _pool.on('error', (err) => {
    console.error('[nile] Pool error:', err.message);
  });

  return _pool;
}

export async function getNileDb(): Promise<Pool> {
  return getNilePool();
}

type TenantRecord = {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
};

export async function createTenant(name: string, metadata: Record<string, unknown> = {}): Promise<TenantRecord> {
  const pool = getNilePool();
  let result;
  try {
    result = await pool.query(
      'INSERT INTO public.tenants (name) VALUES ($1) RETURNING id, name',
      [name]
    );
  } catch (err: any) {
    console.error('[nile] createTenant error:', err.message);
    throw new Error(`Tenant creation failed: ${err.message}`);
  }
  const tenant = result?.rows?.[0];
  if (!tenant?.id) {
    throw new Error('Nile tenant creation did not return a tenant id');
  }
  return { ...tenant, metadata };
}

export async function getTenant(tenantId: string) {
  const pool = getNilePool();
  const result = await pool.query('SELECT * FROM public.tenants WHERE id = $1', [tenantId]);
  return result.rows[0] || null;
}
