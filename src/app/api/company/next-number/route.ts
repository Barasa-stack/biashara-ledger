import { NextResponse } from 'next/server';
import { get, run, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'invoice';
    const data = await withTenantContext(session.tenant_id!, async () => {
      const settings = await get('SELECT * FROM company_settings') as any;
      if (!settings) return { number: `${type.toUpperCase()}-001` };

      if (type === 'credit_note') {
        const prefix = settings.credit_note_prefix || 'CN';
        const seq = settings.next_credit_note_number || 1;
        const lastMonth = settings.last_credit_note_month || '';
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const currentMonth = `${yyyy}-${mm}`;
        let nextSeq = lastMonth !== currentMonth ? 1 : seq;
        const number = `${prefix}-${yyyy}-${String(nextSeq).padStart(4, '0')}`;
        const incrementSeq = nextSeq + 1;
        if (lastMonth !== currentMonth) {
          await run(`UPDATE company_settings SET last_credit_note_month = $1, next_credit_note_number = $2`, [currentMonth, incrementSeq]);
        } else {
          await run(`UPDATE company_settings SET next_credit_note_number = $1`, [incrementSeq]);
        }
        return { number, seq: nextSeq };
      }

      const prefix = type === 'invoice' ? (settings.invoice_prefix || 'INV') : (settings.quotation_prefix || 'QTN');
      const seq = type === 'invoice' ? (settings.next_invoice_number || 1) : (settings.next_quotation_number || 1);
      const lastMonthKey = type === 'invoice' ? 'last_invoice_month' : 'last_quotation_month';
      const nextKey = type === 'invoice' ? 'next_invoice_number' : 'next_quotation_number';
      const lastMonth = type === 'invoice' ? (settings.last_invoice_month || '') : (settings.last_quotation_month || '');
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const currentMonth = `${yyyy}-${mm}`;
      let nextSeq = lastMonth !== currentMonth ? 1 : seq;
      const number = `${prefix}-${dd}/${mm}/${yyyy}-${String(nextSeq).padStart(3, '0')}`;
      const incrementSeq = nextSeq + 1;
      if (lastMonth !== currentMonth) {
        await run(`UPDATE company_settings SET ${lastMonthKey} = $1, ${nextKey} = $2`, [currentMonth, incrementSeq]);
      } else {
        await run(`UPDATE company_settings SET ${nextKey} = $1`, [incrementSeq]);
      }
      return { number, seq: nextSeq };
    });
    return NextResponse.json(data);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}
