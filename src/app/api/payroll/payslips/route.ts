import { NextResponse } from 'next/server';
import { query, run, get, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM payslips ORDER BY created_at DESC');
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
      const ref = body.payslip_reference || `PSL-${Date.now().toString(36).toUpperCase()}`;
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO payslips (tenant_id, salary_id, employee_id, employee_name, payslip_reference, basic_salary, allowances, deductions, overtime, bonuses, gross_pay, nssf_employee, nhif, paye, employer_nssf, net_pay, pay_date, payment_method, period_start, period_end, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
        [session.tenant_id, body.salary_id || null, body.employee_id, emp?.name || body.employee_name || '', ref,
         body.basic_salary || 0, body.allowances || 0, body.deductions || 0,
         body.overtime || 0, body.bonuses || 0, body.gross_pay || 0,
         body.nssf_employee || 0, body.nhif || 0, body.paye || 0,
         body.employer_nssf || 0, body.net_pay || 0,
         body.pay_date, body.payment_method || 'bank',
         body.period_start || '', body.period_end || '', body.status || 'generated']
      );
      return NextResponse.json({ id: result.id, payslip_reference: ref }, { status: 201 });
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
      if (body.action === 'mark_emailed') {
        await run('UPDATE payslips SET emailed=1 WHERE id=$1', [body.id]);
      } else {
        await run(`UPDATE payslips SET basic_salary=$1, allowances=$2, deductions=$3, overtime=$4, bonuses=$5, gross_pay=$6, nssf_employee=$7, nhif=$8, paye=$9, employer_nssf=$10, net_pay=$11, status=$12 WHERE id=$13`,
          [body.basic_salary, body.allowances, body.deductions, body.overtime, body.bonuses, body.gross_pay, body.nssf_employee, body.nhif, body.paye, body.employer_nssf, body.net_pay, body.status, body.id]);
      }
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
      await run('DELETE FROM payslips WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
