import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query(
        `SELECT a.*, l.name as lead_name FROM activity_log a
         LEFT JOIN leads l ON l.id = a.lead_id
         ORDER BY a.created_at DESC LIMIT 100`
      );
    });
    return NextResponse.json(records);
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO activity_log (tenant_id, lead_id, deal_id, type, subject, description)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [session.tenant_id, body.lead_id || null, body.deal_id || null,
         body.type || 'note', body.subject || '', body.description || '']
      );
      return NextResponse.json({ id: result.id }, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const { id } = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM activity_log WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
