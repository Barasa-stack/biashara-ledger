import { get, run } from './db';

export async function generateNextNumber(type: 'invoice' | 'quotation' | 'credit_note'): Promise<string> {
  if (type === 'credit_note') {
    const settings = await get('SELECT credit_note_prefix, next_credit_note_number, last_credit_note_month FROM company_settings') as any;
    const prefix = settings?.credit_note_prefix || 'CN';
    const seq = settings?.next_credit_note_number || 1;
    const lastMonth = settings?.last_credit_note_month || '';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonth = `${yyyy}-${mm}`;
    let nextSeq = seq;
    if (lastMonth !== currentMonth) {
      nextSeq = 1;
      await run(`UPDATE company_settings SET last_credit_note_month = $1, next_credit_note_number = $2`, [currentMonth, nextSeq + 1]);
    } else {
      await run(`UPDATE company_settings SET next_credit_note_number = $1`, [nextSeq + 1]);
    }
    return `${prefix}-${yyyy}-${String(nextSeq).padStart(4, '0')}`;
  }

  const prefixKey = type === 'invoice' ? 'invoice_prefix' : 'quotation_prefix';
  const nextKey = type === 'invoice' ? 'next_invoice_number' : 'next_quotation_number';
  const lastMonthKey = type === 'invoice' ? 'last_invoice_month' : 'last_quotation_month';

  const settings = await get('SELECT * FROM company_settings') as any;
  const prefix = settings?.[prefixKey] || (type === 'invoice' ? 'INV' : 'QTN');

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const currentMonth = `${yyyy}-${mm}`;

  const seq = settings?.[nextKey] || 1;
  const lastMonth = settings?.[lastMonthKey] || '';

  let nextSeq = seq;
  if (lastMonth !== currentMonth) {
    nextSeq = 1;
    await run(`UPDATE company_settings SET ${lastMonthKey} = $1, ${nextKey} = $2`, [currentMonth, nextSeq + 1]);
  } else {
    nextSeq = seq;
    await run(`UPDATE company_settings SET ${nextKey} = $1`, [nextSeq + 1]);
  }

  return `${prefix}-${dd}/${mm}/${yyyy}-${String(nextSeq).padStart(3, '0')}`;
}
