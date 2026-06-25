import { NextResponse } from 'next/server';
import { adminQuery, adminGet, adminRun, getPoolForDatabase } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { createClientDatabase } from '@/lib/admin';

async function guard() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session as any).email !== process.env.ADMIN_EMAIL && (session as any).role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function GET() {
  const g = await guard();
  if (g) return g;
  const clients = await adminQuery(
    `SELECT id, company_name, email, database_name, license_key, max_users,
            is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at
     FROM admin_clients ORDER BY created_at DESC`
  );
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const g = await guard();
  if (g) return g;
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
