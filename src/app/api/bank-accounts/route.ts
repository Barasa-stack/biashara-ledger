import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const accounts = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM bank_accounts ORDER BY account_name');
    });
    return NextResponse.json(accounts);
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
      return await insertReturning<{ id: string }>(
        `INSERT INTO bank_accounts (tenant_id, account_name, account_number, bank_name, currency, opening_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [session.tenant_id, body.account_name, body.account_number || '', body.bank_name || '', body.currency || 'USD', Number(body.opening_balance) || 0]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
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
      await run('UPDATE bank_accounts SET account_name=$1, account_number=$2, bank_name=$3, currency=$4, opening_balance=$5, is_active=$6 WHERE id=$7',
        [body.account_name, body.account_number || '', body.bank_name || '', body.currency || 'USD', Number(body.opening_balance) || 0, body.is_active ?? 1, body.id]);
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

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM bank_statements WHERE bank_account_id=$1', [id]);
      await run('DELETE FROM reconciliation_runs WHERE bank_account_id=$1', [id]);
      await run('DELETE FROM bank_accounts WHERE id=$1', [id]);
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
