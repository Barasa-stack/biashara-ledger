import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';
import { encryptField } from '@/lib/encryption';

export async function GET() {
  try {
    const { session, role } = await requireRole('admin', 'hr_manager');
    const employees = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM employees ORDER BY created_at DESC');
    });
    if (role === 'hr_manager') {
      const masked = (employees as any[]).map(e => ({
        ...e,
        national_id: e.national_id_encrypted ? '[ENCRYPTED]' : e.national_id,
        salary_encrypted: '[ENCRYPTED]',
        bank_account_encrypted: '[ENCRYPTED]',
        account_number: e.account_number ? '****' + e.account_number.slice(-4) : '',
      }));
      return NextResponse.json(masked);
    }
    return NextResponse.json(employees);
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const body = await request.json();
    const { type } = body;

    return await withTenantContext(session.tenant_id!, async () => {
      if (type === 'employee') {
        const salaryEncrypted = body.salary ? encryptField(session.user_id, String(body.salary)) : '';
        const nationalIdEncrypted = body.national_id ? encryptField(session.user_id, body.national_id) : '';
        const bankAccountEncrypted = body.account_number ? encryptField(session.user_id, body.account_number) : '';

        const result = await insertReturning<{ id: string }>(
          `INSERT INTO employees (tenant_id, employee_code, name, date_of_birth, national_id, tax_pin, phone, email, address, department, job_title, date_of_hire, employment_type, bank_name, account_number, emergency_contact_name, emergency_contact_phone, notes, salary, salary_encrypted, national_id_encrypted, bank_account_encrypted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
          [session.tenant_id, body.employee_code || '', body.name, body.date_of_birth || '',
           body.national_id || '', body.tax_pin || '', body.phone || '',
           body.email || '', body.address || '', body.department || '',
           body.job_title || '', body.date_of_hire || '',
           body.employment_type || 'full-time', body.bank_name || '',
           body.account_number || '', body.emergency_contact_name || '',
           body.emergency_contact_phone || '', body.notes || '',
           body.salary || 0, salaryEncrypted, nationalIdEncrypted, bankAccountEncrypted]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      if (body.type === 'employee') {
        const salaryEncrypted = body.salary ? encryptField(body.employee_id, String(body.salary)) : '';
        const nationalIdEncrypted = body.national_id ? encryptField(body.employee_id, body.national_id) : '';
        const bankAccountEncrypted = body.account_number ? encryptField(body.employee_id, body.account_number) : '';

        await run(
          `UPDATE employees SET employee_code=$1, name=$2, date_of_birth=$3, national_id=$4, tax_pin=$5, phone=$6, email=$7, address=$8, department=$9, job_title=$10, date_of_hire=$11, employment_type=$12, bank_name=$13, account_number=$14, emergency_contact_name=$15, emergency_contact_phone=$16, notes=$17, salary=$18, salary_encrypted=$19, national_id_encrypted=$20, bank_account_encrypted=$21 WHERE id=$22`,
          [body.employee_code || '', body.name, body.date_of_birth || '',
           body.national_id || '', body.tax_pin || '', body.phone || '',
           body.email || '', body.address || '', body.department || '',
           body.job_title || '', body.date_of_hire || '',
           body.employment_type || 'full-time', body.bank_name || '',
           body.account_number || '', body.emergency_contact_name || '',
           body.emergency_contact_phone || '', body.notes || '',
           body.salary || 0, salaryEncrypted, nationalIdEncrypted, bankAccountEncrypted, body.id]
        );
      }
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session } = await requireRole('admin', 'hr_manager');
    const { id, type } = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      if (type === 'employee') {
        await run('DELETE FROM employees WHERE id=$1', [id]);
      }
      return NextResponse.json({ success: true });
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}
