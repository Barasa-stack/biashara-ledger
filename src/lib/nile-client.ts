import { Nile as createNile, type Server } from '@niledatabase/server';

function getConnectionConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return { connectionString: url };
  }

  const host = process.env.NILEDB_HOST || 'us-west-2.db.thenile.dev';
  const port = parseInt(process.env.NILEDB_PORT || '5432');
  const database = process.env.NILEDB_DATABASE || 'Biasharaledger_App';
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;

  if (!user || !password) {
    throw new Error('Database credentials not configured. Set DATABASE_URL or NILEDB_USER/NILEDB_PASSWORD.');
  }

  return { host, port, database, user, password };
}

export const nile: Server = createNile(getConnectionConfig());

export async function createTenant(name: string) {
  return nile.tenants.create({ name }) as Promise<{ id: string; name: string }>;
}

export async function getTenant(tenantId: string) {
  return nile.tenants.get(tenantId) as Promise<{ id: string; name: string }>;
}

export async function listTenants() {
  return nile.tenants.list() as Promise<{ id: string; name: string }[]>;
}

export async function deleteTenant(tenantId: string) {
  return nile.tenants.delete(tenantId);
}

export async function setTenantContext(tenantId: string | null) {
  if (tenantId) {
    await nile.withContext({ tenantId });
  } else {
    await nile.noContext();
  }
}

export async function clearTenantContext() {
  await nile.noContext();
}

export async function withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return nile.withContext({ tenantId }, async () => {
    return fn();
  });
}

export async function withoutTenantContext<T>(fn: () => Promise<T>): Promise<T> {
  return nile.noContext(async () => {
    return fn();
  });
}
