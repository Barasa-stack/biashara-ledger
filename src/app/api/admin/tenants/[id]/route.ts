import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { adminQuery, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  try {
    // Verify tenant exists
    const tenant = await adminQuery('SELECT id, name FROM tenants WHERE id = $1::uuid', [id]);
    if (tenant.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantName = (tenant[0] as any).name;

    // Step 1: Find associated admin_clients (managed clients)
    const users = await adminQuery(
      'SELECT id, email FROM users WHERE tenant_id = $1::uuid',
      [id]
    );
    const userEmails = users.map((u: any) => u.email?.toLowerCase()).filter(Boolean);
    const userIds = users.map((u: any) => u.id);
    let deletedClientId: number | null = null;

    if (userEmails.length > 0) {
      const placeholders = userEmails.map((_, i) => `$${i + 1}`).join(',');
      const clients = await adminQuery(
        `SELECT id FROM admin_clients WHERE LOWER(email) IN (${placeholders})`,
        userEmails
      );
      if (clients.length > 0) {
        deletedClientId = (clients[0] as any).id;
      }
    }

    // Step 2: Delete per-tenant data using Nile tenant context
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL || '',
      max: 1,
      idleTimeoutMillis: 10000,
      onConnect: async (client: any) => {
        await client.query(`SET nile.tenant_id = '${id}'`);
      },
    });

    try {
      await tenantPool.query('DELETE FROM sessions');
    } catch {
      try { await adminRun('DELETE FROM sessions WHERE tenant_id = $1::uuid', [id]); } catch {}
    }

    try {
      await tenantPool.query('DELETE FROM users WHERE id IS NOT NULL');
    } catch {
      try {
        for (const uid of userIds) {
          try { await tenantPool.query('DELETE FROM users WHERE id = $1', [uid]); } catch {}
        }
      } catch {}
      try { await adminRun('DELETE FROM users WHERE tenant_id = $1::uuid', [id]); } catch {}
    }

    await tenantPool.end();

    // Step 3: Delete from shared tables via base pool
    if (deletedClientId) {
      try { await adminRun('DELETE FROM admin_license_keys WHERE client_id = $1', [deletedClientId]); } catch {}
      try { await adminRun('DELETE FROM admin_clients WHERE id = $1', [deletedClientId]); } catch {}
    }

    // Step 4: Delete the tenant itself — frees up the Nile tenant slot
    await adminRun('DELETE FROM tenants WHERE id = $1::uuid', [id]);

    console.log(`[delete-tenant] Deleted "${tenantName}" (${id}) by ${session?.email}. Users: ${users.length}, Client: ${deletedClientId}`);

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenantName}" deleted. Nile tenant slot freed.`,
      deleted: {
        tenant_id: id,
        tenant_name: tenantName,
        admin_client_id: deletedClientId,
        users_removed: users.length,
      },
    });
  } catch (err: any) {
    console.error('[delete-tenant] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to delete tenant: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}
