import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const salaries = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM salaries ORDER BY created_at DESC');
    });
    return NextResponse.json(salaries);
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const body = await request.json();

    return await withTenantContext(session.tenant_id!, async () => {
      const emp = body.employee_id
        ? await get('SELECT id, name from employees WHERE id=$1', [body.employee_id]) as any
        : null;

      const result = await insertReturning<{ id: string }>(
        `INSERT INTO salaries (tenant_id, employee_id, employee_name, basic_salary, allowances, deductions, overtime, bonuses, amount, pay_date, payment_method, payslip_reference, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [session.tenant_id, body.employee_id, emp?.name || body.employee_name || '',
         body.basic_salary || 0, body.allowances || 0, body.deductions || 0,
         body.overtime || 0, body.bonuses || 0, body.amount,
         body.pay_date, body.payment_method || 'bank',
         body.payslip_reference || '', body.status || 'pending']
      );
      return NextResponse.json({ id: result.id }, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE salaries SET employee_id=$1, employee_name=$2, basic_salary=$3, allowances=$4, deductions=$5, overtime=$6, bonuses=$7, amount=$8, pay_date=$9, payment_method=$10, payslip_reference=$11, status=$12 WHERE id=$13`,
        [body.employee_id, body.employee_name || '',
         body.basic_salary || 0, body.allowances || 0, body.deductions || 0,
         body.overtime || 0, body.bonuses || 0, body.amount,
         body.pay_date, body.payment_method || 'bank',
         body.payslip_reference || '', body.status || 'pending', body.id]
      );
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const { id } = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM salaries WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}
