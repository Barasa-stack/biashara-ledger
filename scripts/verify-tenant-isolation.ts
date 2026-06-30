import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function withTenant<T>(pool: Pool, tenantId: string, fn: () => Promise<T>): Promise<T> {
  await pool.query("SELECT set_config('nile.tenant_id', $1, false)", [tenantId]);
  try {
    return await fn();
  } finally {
    await pool.query("SELECT set_config('nile.tenant_id', '', false)");
  }
}

async function main() {
  const pool = new Pool({ connectionString });
  const marker = `isolation-${Date.now()}`;

  try {
    const tenantA = await pool.query<{ id: string }>(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [`${marker}-A`]
    );
    const tenantB = await pool.query<{ id: string }>(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [`${marker}-B`]
    );

    const tenantAId = tenantA.rows[0].id;
    const tenantBId = tenantB.rows[0].id;

    await withTenant(pool, tenantAId, async () => {
      await pool.query(
        `INSERT INTO customers (tenant_id, customer_name, email_address)
         VALUES ($1, $2, $3)`,
        [tenantAId, `${marker}-customer-A`, `a-${marker}@example.com`]
      );
    });

    await withTenant(pool, tenantBId, async () => {
      await pool.query(
        `INSERT INTO customers (tenant_id, customer_name, email_address)
         VALUES ($1, $2, $3)`,
        [tenantBId, `${marker}-customer-B`, `b-${marker}@example.com`]
      );
    });

    const visibleToA = await withTenant(pool, tenantAId, async () => {
      return pool.query<{ customer_name: string }>(
        'SELECT customer_name FROM customers WHERE customer_name LIKE $1 ORDER BY customer_name',
        [`${marker}-%`]
      );
    });

    const visibleToB = await withTenant(pool, tenantBId, async () => {
      return pool.query<{ customer_name: string }>(
        'SELECT customer_name FROM customers WHERE customer_name LIKE $1 ORDER BY customer_name',
        [`${marker}-%`]
      );
    });

    const aNames = visibleToA.rows.map((row) => row.customer_name);
    const bNames = visibleToB.rows.map((row) => row.customer_name);

    if (aNames.length !== 1 || aNames[0] !== `${marker}-customer-A`) {
      throw new Error(`Tenant A isolation failed. Saw: ${JSON.stringify(aNames)}`);
    }

    if (bNames.length !== 1 || bNames[0] !== `${marker}-customer-B`) {
      throw new Error(`Tenant B isolation failed. Saw: ${JSON.stringify(bNames)}`);
    }

    console.log('Tenant isolation verified');
    console.log(`Tenant A: ${tenantAId}`);
    console.log(`Tenant B: ${tenantBId}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
