import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateNextNumber } from '@/lib/numbers';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const entries = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT je.*, 
          COALESCE((SELECT SUM(credit_amount) FROM journal_entry_lines WHERE journal_entry_id=je.id), 0) as total_credit,
          COALESCE((SELECT SUM(debit_amount) FROM journal_entry_lines WHERE journal_entry_id=je.id), 0) as total_debit
        FROM journal_entries je ORDER BY je.created_at DESC, je.entry_date DESC`);
    });
    return NextResponse.json(entries);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    let entryNumber = '';
    const result = await withTenantContext(session.tenant_id!, async () => {
      entryNumber = body.entry_number || await generateNextNumber('journal');
      const entry = await insertReturning<{ id: string }>(
        `INSERT INTO journal_entries (tenant_id, entry_number, description, entry_date, reference, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [session.tenant_id, entryNumber, body.description || '', body.entry_date || new Date().toISOString().split('T')[0], body.reference || '', body.status || 'draft']
      );
      if (body.lines && Array.isArray(body.lines)) {
        for (const line of body.lines) {
          await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1, $2, $3, $4, $5, $6)',
            [session.tenant_id, entry.id, line.account_id, line.description || '', Number(line.debit_amount) || 0, Number(line.credit_amount) || 0]);
        }
      }
      return entry;
    });
    return NextResponse.json({ id: result.id, entry_number: entryNumber }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[journal-entries] POST Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      if (body.status === 'posted') {
        const { total_debit, total_credit } = await getEntryTotals(body.id);
        if (Math.abs(total_debit - total_credit) > 0.01) throw new Error('Journal entry is not balanced');
      }
      await run('UPDATE journal_entries SET description=$1, entry_date=$2, reference=$3, status=$4 WHERE id=$5',
        [body.description || '', body.entry_date, body.reference || '', body.status || 'draft', body.id]);
      if (body.lines) {
        await run('DELETE FROM journal_entry_lines WHERE journal_entry_id=$1', [body.id]);
        for (const line of body.lines) {
          await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1, $2, $3, $4, $5, $6)',
            [session.tenant_id, body.id, line.account_id, line.description || '', Number(line.debit_amount) || 0, Number(line.credit_amount) || 0]);
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to update entry' }, { status: 400 }); }
}

async function getEntryTotals(id: string) {
  const result = await query('SELECT COALESCE(SUM(debit_amount), 0) as debit, COALESCE(SUM(credit_amount), 0) as credit FROM journal_entry_lines WHERE journal_entry_id=$1', [id]);
  return { total_debit: Number((result[0] as any)?.debit || 0), total_credit: Number((result[0] as any)?.credit || 0) };
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM journal_entry_lines WHERE journal_entry_id=$1', [id]);
      await run('DELETE FROM journal_entries WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
