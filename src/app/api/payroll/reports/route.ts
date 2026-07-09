import { NextResponse } from 'next/server';
import { query, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'payroll-register';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    return await withTenantContext(session.tenant_id!, async () => {
      if (type === 'payroll-register') {
        let sql = `SELECT s.*, e.tax_pin, e.national_id, e.department
                   FROM salaries s LEFT JOIN employees e ON s.employee_id = e.id
                   WHERE 1=1`;
        const params: any[] = [];
        if (dateFrom) { sql += ` AND s.pay_date >= $${params.length + 1}`; params.push(dateFrom); }
        if (dateTo) { sql += ` AND s.pay_date <= $${params.length + 1}`; params.push(dateTo); }
        sql += ' ORDER BY s.pay_date DESC, s.employee_name';
        const rows = await query(sql, params);
        const totalGross = rows.reduce((s: number, r: any) => s + Number(r.basic_salary || 0) + Number(r.allowances || 0) + Number(r.bonuses || 0) + Number(r.overtime || 0), 0);
        const totalNet = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        return NextResponse.json({ rows, totalGross, totalNet, count: rows.length });
      }

      if (type === 'deduction-summary') {
        const payslips = await query(
          `SELECT COALESCE(SUM(paye),0) as total_paye, COALESCE(SUM(nssf_employee),0) as total_nssf, COALESCE(SUM(nhif),0) as total_nhif, COALESCE(SUM(employer_nssf),0) as total_employer_nssf, COALESCE(SUM(deductions),0) as total_other_deductions, COUNT(*) as count, COALESCE(SUM(gross_pay),0) as total_gross, COALESCE(SUM(net_pay),0) as total_net
           FROM payslips WHERE 1=1` + (dateFrom ? ` AND pay_date >= '${dateFrom}'` : '') + (dateTo ? ` AND pay_date <= '${dateTo}'` : '')
        );
        return NextResponse.json((payslips as any[])[0] || { total_paye: 0, total_nssf: 0, total_nhif: 0, total_employer_nssf: 0, total_other_deductions: 0, count: 0, total_gross: 0, total_net: 0 });
      }

      if (type === 'p9') {
        const empId = searchParams.get('employee_id') || '';
        if (!empId) return NextResponse.json({ error: 'employee_id required' }, { status: 400 });
        const records = await query(
          `SELECT p.*, e.tax_pin, e.national_id, e.name, e.department
           FROM payslips p LEFT JOIN employees e ON p.employee_id = e.id
           WHERE p.employee_id=$1` + (dateFrom ? ` AND p.pay_date>=$2` : '') + (dateTo ? ` AND p.pay_date<=${dateFrom ? '$3' : '$2'}` : '') + ` ORDER BY p.pay_date`,
          [empId, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])]
        );
        const summary = {
          employee_name: (records as any[])[0]?.employee_name || '',
          tax_pin: (records as any[])[0]?.tax_pin || '',
          national_id: (records as any[])[0]?.national_id || '',
          total_gross: (records as any[]).reduce((s: number, r: any) => s + Number(r.gross_pay || 0), 0),
          total_paye: (records as any[]).reduce((s: number, r: any) => s + Number(r.paye || 0), 0),
          total_nssf: (records as any[]).reduce((s: number, r: any) => s + Number(r.nssf_employee || 0), 0),
          total_nhif: (records as any[]).reduce((s: number, r: any) => s + Number(r.nhif || 0), 0),
          total_net: (records as any[]).reduce((s: number, r: any) => s + Number(r.net_pay || 0), 0),
          records,
        };
        return NextResponse.json(summary);
      }

      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
