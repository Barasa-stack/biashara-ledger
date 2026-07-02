import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const statements = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT bs.*, ba.account_name, ba.bank_name FROM bank_statements bs JOIN bank_accounts ba ON ba.id=bs.bank_account_id ORDER BY bs.transaction_date DESC LIMIT 500');
    });
    return NextResponse.json(statements);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      if (body.rows && Array.isArray(body.rows)) {
        const ids: string[] = [];
        for (const row of body.rows) {
          const ins = await insertReturning<{ id: string }>(
            `INSERT INTO bank_statements (tenant_id, bank_account_id, transaction_date, description, reference, amount, type, balance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [session.tenant_id, body.bank_account_id, row.transaction_date || row.date, row.description || '', row.reference || '', Number(row.amount) || 0, row.type || 'DEBIT', Number(row.balance) || 0]
          );
          ids.push(ins.id);
        }
        return { count: ids.length };
      }
      return await insertReturning<{ id: string }>(
        `INSERT INTO bank_statements (tenant_id, bank_account_id, transaction_date, description, reference, amount, type, balance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [session.tenant_id, body.bank_account_id, body.transaction_date, body.description || '', body.reference || '', Number(body.amount) || 0, body.type || 'DEBIT', Number(body.balance) || 0]
      );
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('UPDATE bank_statements SET status=$1, reconciliation_id=$2, matched_transaction_type=$3, matched_transaction_id=$4 WHERE id=$5',
        [body.status || 'unreconciled', body.reconciliation_id || null, body.matched_transaction_type || '', body.matched_transaction_id || '', body.id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
