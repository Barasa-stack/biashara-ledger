import { NextResponse } from 'next/server';
import { query, run, get, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';
import { createTransporter } from '@/lib/email';

function fmtKES(n: number) {
  return `KSh ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US');
}

function buildPayslipHtml(p: any, company: any) {
  const nssfTier1 = Math.min((p.gross_pay||0), 9000) * 0.06;
  const nssfTier2 = Math.max(0, Math.min((p.gross_pay||0) - 9000, 108000 - 9000)) * 0.06;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Payslip — ${p.employee_name}</title>
<style>
  body{font-family:'Inter',Arial,sans-serif;color:#1e293b;font-size:13px;line-height:1.5;max-width:600px;margin:auto;padding:20px}
  h1{font-size:20px;margin:0 0 2px;color:#0f172a}h2{font-size:14px;color:#64748b;margin:0 0 20px;font-weight:400}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px}
  th{padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9}.r{text-align:right}.b{font-weight:700}.red{color:#dc2626}.green{color:#16a34a}
  .total{border-top:2px solid #0f172a;font-size:15px}
  .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}
  .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;background:#dcfce7;color:#16a34a}
</style></head><body>
  <div style="text-align:right"><span class="badge">${p.payslip_reference || ''}</span></div>
  <h1>${p.employee_name}</h1>
  <h2>Pay Period: ${fmtDate(p.period_start)} — ${fmtDate(p.period_end)}</h2>
  <table>
    <tr><th colspan="2">Earnings</th></tr>
    <tr><td>Basic Salary</td><td class="r">${fmtKES(p.basic_salary)}</td></tr>
    <tr><td>Allowances</td><td class="r">${fmtKES(p.allowances)}</td></tr>
    <tr><td>Overtime ${p.overtime_hours ? '('+p.overtime_hours+'h)' : ''}</td><td class="r">${fmtKES(p.overtime)}</td></tr>
    <tr><td>Bonuses</td><td class="r">${fmtKES(p.bonuses)}</td></tr>
    <tr class="b"><td>Gross Pay</td><td class="r">${fmtKES(p.gross_pay)}</td></tr>
  </table>
  <table>
    <tr><th colspan="2" class="red">Deductions</th></tr>
    <tr><td>PAYE (Income Tax)</td><td class="r red">-${fmtKES(p.paye)}</td></tr>
    <tr><td>NSSF Tier I (first 9,000)</td><td class="r red">-${fmtKES(nssfTier1)}</td></tr>
    <tr><td>NSSF Tier II (9,001–108,000)</td><td class="r red">-${fmtKES(nssfTier2)}</td></tr>
    <tr><td>SHIF (2.75%)</td><td class="r red">-${fmtKES(p.shif || p.nhif)}</td></tr>
    <tr><td>AHL (1.5%)</td><td class="r red">-${fmtKES(p.ahl)}</td></tr>
    <tr><td>Other Deductions</td><td class="r red">-${fmtKES(p.deductions)}</td></tr>
    <tr class="b total green"><td>Net Pay</td><td class="r">${fmtKES(p.net_pay)}</td></tr>
  </table>
  <div class="footer">
    <p style="margin:0 0 4px">${company?.company_name || 'BiasharaLedger'}</p>
    <p style="margin:0">Payment: ${p.payment_method} | Pay Date: ${fmtDate(p.pay_date)}</p>
  </div>
</body></html>`;
}

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const records = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM payslips ORDER BY created_at DESC');
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
      const ref = body.payslip_reference || `PSL-${Date.now().toString(36).toUpperCase()}`;
      const result = await insertReturning<{ id: string }>(
        `INSERT INTO payslips (tenant_id, salary_id, employee_id, employee_name, payslip_reference, basic_salary, allowances, deductions, overtime, overtime_hours, overtime_type, bonuses, gross_pay, nssf_employee, nhif, shif, ahl, paye, employer_nssf, employer_ahl, net_pay, pay_date, payment_method, period_start, period_end, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING id`,
        [session.tenant_id, body.salary_id || null, body.employee_id, emp?.name || body.employee_name || '', ref,
         body.basic_salary || 0, body.allowances || 0, body.deductions || 0,
         body.overtime || 0, body.overtime_hours || 0, body.overtime_type || 'none',
         body.bonuses || 0, body.gross_pay || 0,
         body.nssf_employee || 0, body.nhif || 0, body.shif || 0, body.ahl || 0, body.paye || 0,
         body.employer_nssf || 0, body.employer_ahl || 0, body.net_pay || 0,
         body.pay_date, body.payment_method || 'bank',
         body.period_start || '', body.period_end || '', body.status || 'generated']
      );
      return NextResponse.json({ id: result.id, payslip_reference: ref }, { status: 201 });
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
      if (body.action === 'mark_emailed') {
        await run('UPDATE payslips SET emailed=1 WHERE id=$1', [body.id]);
      } else if (body.action === 'send_email') {
        const payslip = await get('SELECT * FROM payslips WHERE id=$1', [body.id]) as any;
        if (!payslip) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });

        const employee = await get('SELECT id, name, email, phone FROM employees WHERE id=$1', [payslip.employee_id]) as any;
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        if (!employee.email) return NextResponse.json({ error: 'Employee has no email address on file' }, { status: 400 });

        const company = await get('SELECT * FROM company_settings LIMIT 1') as any;
        const transporter = await createTransporter(session.tenant_id!);
        if (!transporter) return NextResponse.json({ error: 'SMTP not configured. Set up email in Company Settings first.' }, { status: 400 });

        const html = buildPayslipHtml(payslip, company);
        const companyName = company?.company_name || 'BiasharaLedger';
        const subject = `Payslip — ${payslip.payslip_reference || payslip.employee_name}`;

        await transporter.sendMail({
          from: `"${companyName}" <${company?.email || 'noreply@biasharaledger.com'}>`,
          to: employee.email,
          subject,
          html,
        });

        await run('UPDATE payslips SET emailed=1 WHERE id=$1', [body.id]);
        return NextResponse.json({ success: true, emailed: true, to: employee.email, name: employee.name });
      } else {
        await run(`UPDATE payslips SET basic_salary=$1, allowances=$2, deductions=$3, overtime=$4, overtime_hours=$5, overtime_type=$6, bonuses=$7, gross_pay=$8, nssf_employee=$9, nhif=$10, shif=$11, ahl=$12, paye=$13, employer_nssf=$14, employer_ahl=$15, net_pay=$16, status=$17 WHERE id=$18`,
          [body.basic_salary, body.allowances, body.deductions, body.overtime, body.overtime_hours || 0, body.overtime_type || 'none', body.bonuses, body.gross_pay, body.nssf_employee, body.nhif, body.shif || 0, body.ahl || 0, body.paye, body.employer_nssf, body.employer_ahl || 0, body.net_pay, body.status, body.id]);
      }
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
      await run('DELETE FROM payslips WHERE id=$1', [id]);
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
