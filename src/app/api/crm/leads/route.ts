import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = await withTenantContext(session.tenant_id!, () =>
      query('SELECT * FROM leads ORDER BY created_at DESC')
    );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, () =>
      insertReturning<{ id: string }>(
        'INSERT INTO leads (tenant_id, name, email, phone, source, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [session.tenant_id, body.name || '', body.email || '', body.phone || '', body.source || 'other', body.status || 'new', body.notes || '']
      )
    );
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    await withTenantContext(session.tenant_id!, () =>
      run(
        'UPDATE leads SET name=$1, email=$2, phone=$3, source=$4, status=$5, notes=$6, updated_at=NOW() WHERE id=$7',
        [body.name || '', body.email || '', body.phone || '', body.source || 'other', body.status || 'new', body.notes || '', body.id]
      )
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, () =>
      run('DELETE FROM leads WHERE id=$1', [id])
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
