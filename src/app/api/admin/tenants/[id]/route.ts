import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { adminQuery, adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(
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
    const existing = await adminQuery('SELECT id FROM tenants WHERE id = $1::uuid', [id]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Tenant already exists' }, { status: 409 });
    }

    // Check if business data still references this tenant
    const companySettings = await adminQuery('SELECT company_name, email FROM company_settings WHERE tenant_id = $1::uuid LIMIT 1', [id]);
    const tenantName = (companySettings[0] as any)?.company_name || 'Restored Tenant';
    const adminEmail = (companySettings[0] as any)?.email || '';

    // Check for any surviving user emails
    const survivingUsers = await adminQuery('SELECT email FROM users WHERE tenant_id = $1::uuid', [id]);

    // Get admin email from env or fallback
    const targetEmail = adminEmail || process.env.ADMIN_EMAIL || '';
    if (!targetEmail) {
      return NextResponse.json({ error: 'No admin email found. Set ADMIN_EMAIL env var.' }, { status: 400 });
    }

    // Check if admin_clients record still exists for this email
    const adminClient = await adminGet('SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1) LIMIT 1', [targetEmail]);

    // Re-insert the tenant
    await adminRun('INSERT INTO tenants (id, name) VALUES ($1::uuid, $2)', [id, tenantName]);

    // Re-create admin user with a fresh password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!';
    const hashedPw = await bcrypt.hash(tempPassword, 10);
    const userId = Math.floor(Math.random() * 2147483647) + 1;

    await adminRun(
      `INSERT INTO users (id, tenant_id, email, password, password_hash, first_name, verified, subscription_plan, subscription_status, license_status, license_key, country, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [userId, id, targetEmail, hashedPw, hashedPw, 'Admin', true, 'Premium', 'active', 'active', `Premium-${targetEmail}`, 'KE', 'admin']
    );

    // Re-create company_settings if missing
    try {
      await adminRun(
        `INSERT INTO company_settings (tenant_id, company_name, email, base_currency)
         VALUES ($1, $2, $3, 'KES') ON CONFLICT (tenant_id) DO NOTHING`,
        [id, tenantName, targetEmail]
      );
    } catch {}

    console.log(`[restore-tenant] Restored "${tenantName}" (${id}) by ${session?.email}. Admin: ${targetEmail}`);

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenantName}" restored.`,
      temp_password: tempPassword,
      admin_email: targetEmail,
      data_found: {
        company_settings: companySettings.length > 0,
        admin_client: !!adminClient,
        surviving_users: survivingUsers.length,
      },
    });
  } catch (err: any) {
    console.error('[restore-tenant] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to restore tenant: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

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
