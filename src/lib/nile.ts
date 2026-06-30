type NileInstance = {
  db: {
    query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
  };
  tenants: {
    get: (id: string) => Promise<any>;
  };
};

let _nile: NileInstance | null = null;

async function getNile(): Promise<NileInstance> {
  if (_nile) return _nile;
  const { Nile } = await import('@niledatabase/server');
  const config: Record<string, string> = {};
  if (process.env.NILEDB_API_URL) {
    config.apiUrl = process.env.NILEDB_API_URL;
  }
  _nile = Nile(config) as unknown as NileInstance;
  return _nile!;
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
