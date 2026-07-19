import { NextResponse } from 'next/server';
import { get, run, exec, withTenantContext, withoutTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

const ALLOWED_FIELDS = [
  'company_name', 'address', 'location', 'country', 'phone', 'email',
  'kra_pin', 'logo_base64', 'paybill_number', 'bank_name', 'account_number',
  'bank_branch', 'branch_code', 'bank_code', 'swift_code',
  'terms_conditions', 'invoice_prefix', 'quotation_prefix',
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass',
  'vat_rate', 'income_tax_rate', 'tax_filing_frequency',
  'theme_color', 'invoice_footer_text', 'payment_instructions', 'invoice_logo_base64',
  'base_currency',
];

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const settings = await withTenantContext(session.tenant_id!, async () => {
      return await get('SELECT * FROM company_settings') as any;
    });
    if (settings && (settings as any).industry && !(settings as any).industries) {
      await withoutTenantContext(async () => {
        await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}'`);
      });
      await withTenantContext(session.tenant_id!, async () => {
        await run(`UPDATE company_settings SET industries=$1, industry=NULL WHERE industries IS NULL OR industries='{}'`, [[(settings as any).industry]]);
      });
      (settings as any).industries = [(settings as any).industry];
    }
    return NextResponse.json(settings || {});
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api] Error:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        setClauses.push(`${field}=$${paramIdx++}`);
        values.push(body[field] ?? '');
      }
    }

    if (body.industries !== undefined || body.industry !== undefined) {
      const industries = body.industries || (body.industry ? [body.industry] : []);
      setClauses.push(`industries=$${paramIdx++}`);
      values.push(industries);
    }

    if (body.custom_field_templates !== undefined) {
      setClauses.push(`custom_field_templates=$${paramIdx++}`);
      values.push(JSON.stringify(body.custom_field_templates));
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true });
    }

    setClauses.push(`updated_at=NOW()`);
    values.push(session.tenant_id);

    await withTenantContext(session.tenant_id!, async () => {
      try {
        const result = await run(
          `UPDATE company_settings SET ${setClauses.join(', ')} WHERE tenant_id=$${paramIdx}`,
          values
        );
        if (result.rowCount === 0) {
          throw new Error('NOT_FOUND');
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'NOT_FOUND') throw e;
        if (msg.includes('does not exist')) {
          await withoutTenantContext(async () => {
            await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}'`);
            await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS custom_field_templates JSONB DEFAULT '[]'`);
          });
          const result = await run(
            `UPDATE company_settings SET ${setClauses.join(', ')} WHERE tenant_id=$${paramIdx}`,
            values
          );
          if (result.rowCount === 0) throw new Error('NOT_FOUND');
        } else {
          throw e;
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (e?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Company settings not found' }, { status: 404 });
    }
    console.error('[api] Error:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
