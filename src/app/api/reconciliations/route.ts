import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const reconciliations = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT rr.*, ba.account_name, ba.bank_name,
          (SELECT COUNT(*) FROM bank_statements WHERE reconciliation_id=rr.id AND status='reconciled') as matched_count,
          (SELECT COUNT(*) FROM bank_statements WHERE reconciliation_id=rr.id AND status='unreconciled') as unmatched_count
        FROM reconciliation_runs rr
        JOIN bank_accounts ba ON ba.id=rr.bank_account_id
        ORDER BY rr.created_at DESC`);
    });
    return NextResponse.json(reconciliations);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[reconciliations] GET Error:', msg);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        `INSERT INTO reconciliation_runs (tenant_id, bank_account_id, statement_balance, system_balance, difference, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'in_progress') RETURNING id`,
        [session.tenant_id, body.bank_account_id, Number(body.statement_balance) || 0, Number(body.system_balance) || 0, Number(body.difference) || 0, body.start_date || body.reconciliation_date, body.end_date || body.reconciliation_date]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[reconciliations] POST Error:', msg);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('UPDATE reconciliation_runs SET status=$1, statement_balance=$2, system_balance=$3, difference=$4 WHERE id=$5',
        [body.status || 'completed', Number(body.statement_balance) || 0, Number(body.system_balance) || 0, Number(body.difference) || 0, body.id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[reconciliations] PUT Error:', msg);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
