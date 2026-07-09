import { NextResponse } from 'next/server';
import { query, run, get, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM attendance ORDER BY date DESC, clock_in DESC');
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
      const emp = body.employee_id
        ? await get('SELECT id, name FROM employees WHERE id=$1', [body.employee_id]) as any
        : null;
      let hours = 0;
      let overtime_hours = 0;
      if (body.clock_in && body.clock_out) {
        const [cih, cim] = body.clock_in.split(':').map(Number);
        const [coh, com] = body.clock_out.split(':').map(Number);
        const totalMinutes = (coh * 60 + com) - (cih * 60 + cim);
        hours = Math.max(0, totalMinutes / 60);
        overtime_hours = Math.max(0, hours - 8);
        hours = Math.min(hours, 16);
      }
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO attendance (tenant_id, employee_id, employee_name, date, clock_in, clock_out, hours, overtime_hours, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [session.tenant_id, body.employee_id, emp?.name || '', body.date, body.clock_in || '', body.clock_out || '', hours, overtime_hours, body.status || 'present', body.notes || '']
      );
      return NextResponse.json({ id: result.id }, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      let hours = body.hours || 0;
      let overtime_hours = body.overtime_hours || 0;
      if (body.clock_in && body.clock_out) {
        const [cih, cim] = body.clock_in.split(':').map(Number);
        const [coh, com] = body.clock_out.split(':').map(Number);
        const totalMinutes = (coh * 60 + com) - (cih * 60 + cim);
        hours = Math.max(0, totalMinutes / 60);
        overtime_hours = Math.max(0, hours - 8);
        hours = Math.min(hours, 16);
      }
      await run(
        `UPDATE attendance SET employee_id=$1, employee_name=$2, date=$3, clock_in=$4, clock_out=$5, hours=$6, overtime_hours=$7, status=$8, notes=$9 WHERE id=$10`,
        [body.employee_id, body.employee_name || '', body.date, body.clock_in || '', body.clock_out || '', hours, overtime_hours, body.status || 'present', body.notes || '', body.id]
      );
      return NextResponse.json({ success: true });
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
      await run('DELETE FROM attendance WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
