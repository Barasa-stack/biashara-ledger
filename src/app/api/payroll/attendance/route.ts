import { NextResponse } from 'next/server';
import { query, run, get, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';
import { isPublicHoliday, getHolidayName } from '@/lib/payroll/holidays';

/** Detect if a date is a weekend or gazetted public holiday (treated as rest day per Employment Act) */
function isRestDay(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isPublicHoliday(d)) return true;
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Get the holiday label if applicable */
function dayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const h = getHolidayName(d);
  if (h) return `Public Holiday: ${h}`;
  const day = d.getDay();
  if (day === 0 || day === 6) return 'Rest Day (Weekend)';
  return 'Weekday';
}

/** Auto-deduct 1-hour unpaid break for shifts ≥ 6 hours (standard Kenyan practice) */
function computeWorkHours(clockIn: string, clockOut: string, dateStr: string): { hours: number; overtime_hours: number; overtime_type: 'weekday' | 'rest_day' } {
  if (!clockIn || !clockOut) return { hours: 0, overtime_hours: 0, overtime_type: 'weekday' };
  const [cih, cim] = clockIn.split(':').map(Number);
  const [coh, com] = clockOut.split(':').map(Number);
  let totalMinutes = (coh * 60 + com) - (cih * 60 + cim);
  if (totalMinutes < 0) totalMinutes += 1440; // past midnight
  let hours = totalMinutes / 60;
  // Deduct 1-hour unpaid break for shifts ≥ 6 hours
  if (hours >= 6) hours = Math.max(0, hours - 1);
  hours = Math.min(hours, 16);

  const rd = isRestDay(dateStr);
  // Overtime kicks in after 8 actual work hours (Employment Act Section 27)
  const overtime_hours = Math.max(0, hours - 8);
  const overtime_type = rd ? 'rest_day' : 'weekday';

  return { hours: rd ? hours : Math.min(hours, 8 + overtime_hours), overtime_hours, overtime_type };
}

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query(
        `SELECT employee_uuid AS employee_id, tenant_id, id, employee_name, date, clock_in, clock_out, hours, overtime_hours, overtime_type, status, notes, created_at, updated_at FROM attendance ORDER BY date DESC, clock_in DESC`
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
      const { hours, overtime_hours, overtime_type } = computeWorkHours(body.clock_in, body.clock_out, body.date);
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO attendance (tenant_id, employee_uuid, employee_name, date, clock_in, clock_out, hours, overtime_hours, overtime_type, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [session.tenant_id, employeeUuid, emp?.name || '', body.date, body.clock_in || '', body.clock_out || '', hours, overtime_hours, overtime_type, body.status || 'present', body.notes || '']
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
      const { hours, overtime_hours, overtime_type } = body.clock_in && body.clock_out
        ? computeWorkHours(body.clock_in, body.clock_out, body.date)
        : { hours: body.hours || 0, overtime_hours: body.overtime_hours || 0, overtime_type: (body.overtime_type || 'weekday') as 'weekday' | 'rest_day' };
      await run(
        `UPDATE attendance SET employee_uuid=$1, employee_name=$2, date=$3, clock_in=$4, clock_out=$5, hours=$6, overtime_hours=$7, overtime_type=$8, status=$9, notes=$10 WHERE id=$11`,
        [body.employee_id || '', body.employee_name || '', body.date, body.clock_in || '', body.clock_out || '', hours, overtime_hours, overtime_type, body.status || 'present', body.notes || '', body.id]
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
      await run('DELETE FROM attendance WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
