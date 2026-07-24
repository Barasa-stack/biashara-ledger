import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminQuery, adminGet, adminRun } from '@/lib/db';
import { adminGuard, createClientDatabase } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function GET() {
  try {
    const { error } = await adminGuard();
    if (error) return error;

    let clients: any[] = [];
    let selfRegistered: any[] = [];

    try {
      const clientsResult = await adminQuery(`SELECT id, company_name, email, database_name, license_key, max_users, is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at FROM admin_clients ORDER BY created_at DESC`);
      clients = clientsResult;
    } catch (e: any) {
      console.error('clients query error:', e.message);
    }

    try {
      let userQuery = `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.subscription_plan, u.subscription_status, u.subscription_expiry, u.license_status, u.verified, u.created_at FROM users u WHERE 1=1`;
      if (clients.length > 0) {
        userQuery += ` AND NOT EXISTS (SELECT 1 FROM admin_clients ac WHERE ac.id::text = u.tenant_id::text) ORDER BY u.created_at DESC`;
      } else {
        userQuery += ` ORDER BY u.created_at DESC`;
      }
      const usersResult = await adminQuery(userQuery);
      selfRegistered = usersResult;
    } catch (e: any) {
      console.error('selfRegistered query error:', e.message);
    }

    const allClients = clients.map(c => ({ ...c, source: 'managed' }));
    const allSelfRegistered = selfRegistered.map(u => ({
      ...u, source: 'self_registered',
      license_key: null, max_users: null, database_name: null,
      is_active: u.subscription_status === 'active' || u.subscription_status === 'trial',
      is_trial: u.subscription_plan === 'trial' || u.subscription_status === 'trial',
      expires_at: u.subscription_expiry,
    }));

    return NextResponse.json([...allClients, ...allSelfRegistered]);
  } catch (err) {
    console.error('GET /api/admin/clients error:', err);
    return NextResponse.json({ clients: [], error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { company_name, email, max_users, password } = await request.json();
    if (!company_name || !email) {
      return NextResponse.json({ error: 'Company name and email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingAdmin = await adminGet('SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (existingAdmin) {
      return NextResponse.json({ error: 'A client with this email already exists in admin panel' }, { status: 409 });
    }

    const existingUser = await adminGet(
      `SELECT u.id, u.tenant_id, u.password_hash, t.name as company_name
       FROM users u JOIN tenants t ON t.id = u.tenant_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    if (existingUser) {
      const passwordHash = password ? await bcrypt.hash(password, 10) : existingUser.password_hash;
      await adminRun(
        `UPDATE users SET subscription_plan = 'premium', subscription_status = 'active',
         subscription_expiry = $1, license_status = 'active', verified = 1, role = 'admin'
         WHERE id = $2`,
        [expiresAt, existingUser.id]
      );

      const clientResult = await adminQuery(
        `INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, expires_at, is_active, is_trial)
         VALUES ($1, $2, 'manual-' || substr(md5(random()::text), 1, 8), 'MANUAL-' || upper(substr(md5(random()::text), 1, 12)), $3, $4::timestamptz, true, false)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, company_name, email`,
        [company_name, email, max_users || 5, expiresAt]
      );

      const client = clientResult[0] || { id: existingUser.tenant_id, company_name, email };

      await adminRun(
        `INSERT INTO admin_license_keys (license_key, client_id, expires_at, is_active)
         VALUES ($1, $2, $3::timestamptz, true)
         ON CONFLICT (license_key) DO NOTHING`,
        ['MANUAL-' + Math.random().toString(36).substring(2, 14).toUpperCase(), client.id, expiresAt]
      );

      await logAdminAction({ action: 'Client Created', entityType: 'client', details: `Client ${company_name} (${email}) created` });

      return NextResponse.json({ success: true, client, activated: true });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const client = await createClientDatabase(email, company_name, max_users || 5, 'premium', passwordHash);
    await logAdminAction({ action: 'Client Created', entityType: 'client', details: `Client ${company_name} (${email}) created with new database` });
    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error('Create client error:', err);
    return NextResponse.json({ error: 'Failed to create client: ' + err.message }, { status: 500 });
  }
}
