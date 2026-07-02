import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard, dropClientSchema } from '@/lib/admin';

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
      `SELECT id, company_name, email, database_name, license_key, max_users,
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
