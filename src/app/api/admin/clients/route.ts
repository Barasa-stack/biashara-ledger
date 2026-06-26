import { NextResponse } from 'next/server';
import { adminQuery, adminGet } from '@/lib/db';
import { adminGuard, createClientDatabase } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const clients = await adminQuery(
    `SELECT id, company_name, email, database_name, license_key, max_users,
            is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
     FROM admin_clients ORDER BY created_at DESC`
  );
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { company_name, email, max_users } = await request.json();
    if (!company_name || !email) {
      return NextResponse.json({ error: 'Company name and email required' }, { status: 400 });
    }

    const existing = await adminGet('SELECT id FROM admin_clients WHERE email = $1', [email]);
    if (existing) {
      return NextResponse.json({ error: 'A client with this email already exists' }, { status: 409 });
    }

    const client = await createClientDatabase(email, company_name, max_users || 5);
    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
