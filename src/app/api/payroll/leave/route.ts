import { NextResponse } from 'next/server';
import { query, run, get, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query(
        `SELECT employee_uuid AS employee_id, tenant_id, id, employee_name, leave_type, reason, start_date, end_date, days, status, approved_by, approved_at, notes, created_at, updated_at FROM leave_requests ORDER BY created_at DESC`
      );
    });
    return NextResponse.json(records);
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      const emp = body.employee_id
        ? await get('SELECT id, name FROM employees WHERE id=$1', [body.employee_id]) as any
        : null;
      const employeeUuid = body.employee_id || '';
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO leave_requests (tenant_id, employee_uuid, employee_name, leave_type, reason, start_date, end_date, days, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [session.tenant_id, employeeUuid, emp?.name || '', body.leave_type || 'annual', body.reason || '', body.start_date, body.end_date, body.days || 1, body.status || 'pending']
      );
      return NextResponse.json({ id: result.id }, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE leave_requests SET employee_uuid=$1, employee_name=$2, leave_type=$3, reason=$4, start_date=$5, end_date=$6, days=$7, status=$8 WHERE id=$9`,
        [body.employee_id || '', body.employee_name || '', body.leave_type || 'annual', body.reason || '', body.start_date, body.end_date, body.days || 1, body.status || 'pending', body.id]
      );
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const { id } = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM leave_requests WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
