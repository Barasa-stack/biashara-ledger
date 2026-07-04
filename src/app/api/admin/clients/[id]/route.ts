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
    const client = await adminGet(
      `SELECT id, company_name, email, database_name, license_key, max_users, plan,
              is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
       FROM admin_clients WHERE id = $1`,
      [id]
    );

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

    const client = await adminGet(
      `SELECT id, email FROM admin_clients WHERE id = $1`,
      [id]
    );
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientEmail = (client as any).email;

    // Update admin_clients
    await adminRun(
      `UPDATE admin_clients SET plan = $1 WHERE id = $2`,
      [plan, id]
    );

    // Update admin_license_keys
    await adminRun(
      `UPDATE admin_license_keys SET plan = $1 WHERE client_id = $2`,
      [plan, id]
    );

    // Update users table and ensure the user's subscription is active.
    await adminRun(
      `UPDATE users SET subscription_plan = $1,
                        subscription_status = 'active',
                        license_status = 'active',
                        subscription_expiry = CASE
                          WHEN subscription_expiry IS NULL OR subscription_expiry < NOW() THEN NOW() + INTERVAL '365 days'
                          ELSE subscription_expiry
                        END
       WHERE LOWER(email) = LOWER($2)`,
      [plan, clientEmail]
    );

    const updatedClient = await adminGet(
      `SELECT id, company_name, email, database_name, license_key, max_users, plan,
              is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
       FROM admin_clients WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (err: any) {
    console.error('PATCH /api/admin/clients/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update client plan' }, { status: 500 });
  }
}
