import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard, dropClientSchema } from '@/lib/admin';
import { normalizePlan } from '@/lib/feature-gate';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const client = await adminGet('SELECT id, database_name FROM admin_clients WHERE id = $1', [id]);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const dbName = (client as any).database_name;

    await adminRun('DELETE FROM admin_license_keys WHERE client_id = $1', [id]);
    await adminRun('DELETE FROM admin_clients WHERE id = $1', [id]);

    try {
      await dropClientSchema(dbName);
    } catch (dbErr) {
      console.warn('Could not drop database (may not exist):', (dbErr as Error).message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    let client = await adminGet(
      `SELECT id, company_name, email, database_name, license_key, max_users, plan,
              is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
       FROM admin_clients WHERE CAST(id AS TEXT) = $1`,
      [id]
    );

    if (!client) {
      const user = await adminGet(
        `SELECT id, email, first_name, last_name, subscription_plan, subscription_status,
                subscription_expiry, license_status, trial_end_date, verified, created_at
         FROM users WHERE CAST(id AS TEXT) = $1`,
        [id]
      );
      if (user) {
        client = {
          id: (user as any).id,
          company_name: `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim() || (user as any).email,
          email: (user as any).email,
          database_name: null,
          license_key: null,
          max_users: null,
          plan: (user as any).subscription_plan,
          is_active: (user as any).subscription_status === 'active' || (user as any).subscription_status === 'trial',
          is_trial: (user as any).subscription_plan === 'trial' || (user as any).subscription_status === 'trial',
          trial_start_date: null,
          trial_end_date: (user as any).trial_end_date,
          expires_at: (user as any).subscription_expiry,
          last_active: null,
          created_at: (user as any).created_at,
          source: 'self_registered',
          subscription_status: (user as any).subscription_status,
          license_status: (user as any).license_status,
        };
      }
    }

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const plan = normalizePlan(body.plan);
    if (plan === 'trial') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    let allowedModules: string[] = [];
    if (plan === 'custom' && body.modules) {
      allowedModules = body.modules;
    }

    // Try admin_clients first, then fall back to users table
    let client = await adminGet(
      `SELECT id, email FROM admin_clients WHERE CAST(id AS TEXT) = $1`,
      [id]
    );

    let clientEmail: string | null = null;
    let isUserTable = false;

    if (!client) {
      // Look up user directly
      const user = await adminGet(
        `SELECT id, email FROM users WHERE CAST(id AS TEXT) = $1`,
        [id]
      );
      if (user) {
        clientEmail = (user as any).email;
        isUserTable = true;
      }
    } else {
      clientEmail = (client as any).email;
    }

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!isUserTable) {
      // Update admin_clients
      await adminRun(
        `UPDATE admin_clients SET plan = $1 WHERE CAST(id AS TEXT) = $2`,
        [plan, id]
      );

      // Update admin_license_keys
      await adminRun(
        `UPDATE admin_license_keys SET plan = $1 WHERE client_id = (SELECT id FROM admin_clients WHERE CAST(id AS TEXT) = $2)`,
        [plan, id]
      );
    }

    // Update users table
    const modulesJson = plan === 'custom' && allowedModules.length > 0 ? JSON.stringify(allowedModules) : '[]';
    await adminRun(
      `UPDATE users SET subscription_plan = $1,
                        subscription_status = 'active',
                        license_status = 'active',
                        allowed_modules = $2,
                        subscription_expiry = CASE
                          WHEN subscription_expiry IS NULL OR subscription_expiry < NOW() THEN NOW() + INTERVAL '365 days'
                          ELSE subscription_expiry
                        END
       WHERE LOWER(email) = LOWER($3)`,
      [plan, modulesJson, clientEmail]
    );

    // Return updated data
    const updatedClient = await adminGet(
      `SELECT id, company_name, email, database_name, license_key, max_users, plan,
              is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
       FROM admin_clients WHERE CAST(id AS TEXT) = $1`,
      [id]
    ) || await adminGet(
      `SELECT id, email, subscription_plan as plan, subscription_status as is_active,
              subscription_expiry as expires_at, created_at
       FROM users WHERE CAST(id AS TEXT) = $1`,
      [id]
    );

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (err: any) {
    console.error('PATCH /api/admin/clients/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update client plan' }, { status: 500 });
  }
}
