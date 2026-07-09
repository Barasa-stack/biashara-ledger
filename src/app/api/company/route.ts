import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { ensureDbInitialized } from '@/lib/init';

export async function GET() {
  try {
    await ensureDbInitialized();
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const settings = await withTenantContext(session.tenant_id!, async () => {
      return await get('SELECT * FROM company_settings') as any;
    });
    return NextResponse.json(settings || {});
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDbInitialized();
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE company_settings SET
          company_name=$1, address=$2, location=$3, country=$4, phone=$5, email=$6,
          kra_pin=$7, logo_base64=$8, paybill_number=$9, bank_name=$10, account_number=$11,
          bank_branch=$12, branch_code=$13, bank_code=$14, swift_code=$15,
          terms_conditions=$16, invoice_prefix=$17, quotation_prefix=$18,
          smtp_host=$19, smtp_port=$20, smtp_user=$21, smtp_pass=$22,
          vat_rate=$23, income_tax_rate=$24, tax_filing_frequency=$25,
          theme_color=$26, invoice_footer_text=$27, payment_instructions=$28, invoice_logo_base64=$29,
          base_currency=$30,
          updated_at=NOW()`,
        [body.company_name || '', body.address || '', body.location || '',
         body.country || 'Kenya', body.phone || '', body.email || '',
         body.kra_pin || '', body.logo_base64 || '', body.paybill_number || '',
         body.bank_name || '', body.account_number || '', body.bank_branch || '',
         body.branch_code || '', body.bank_code || '', body.swift_code || '',
         body.terms_conditions || '', body.invoice_prefix || 'INV', body.quotation_prefix || 'QTN',
         body.smtp_host || '', body.smtp_port || '587', body.smtp_user || '', body.smtp_pass || '',
         body.vat_rate ?? 16, body.income_tax_rate ?? 0, body.tax_filing_frequency || 'monthly',
         body.theme_color || '#df1c1c', body.invoice_footer_text || '', body.payment_instructions || '', body.invoice_logo_base64 || '',
         body.base_currency || 'KES']
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}
