import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const requests = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT ar.*, aw.workflow_name, aw.approver_role 
        FROM approval_requests ar 
        LEFT JOIN approval_workflows aw ON aw.id=ar.workflow_id 
        ORDER BY ar.created_at DESC`);
    });
    return NextResponse.json(requests);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        `INSERT INTO approval_requests (tenant_id, workflow_id, entity_type, entity_id, entity_amount, requested_by, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [session.tenant_id, body.workflow_id || null, body.entity_type, body.entity_id, Number(body.entity_amount) || 0, body.requested_by || session.user_id, body.notes || '']
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('UPDATE approval_requests SET status=$1, approved_by=$2, approved_at=$3, notes=$4 WHERE id=$5',
        [body.status || 'pending', body.status === 'approved' || body.status === 'rejected' ? session.user_id : null,
         body.status === 'approved' || body.status === 'rejected' ? new Date().toISOString().split('T')[0] : '', body.notes || '', body.id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
