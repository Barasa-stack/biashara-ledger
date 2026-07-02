import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash at Bank', type: 'ASSET' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
  { code: '1200', name: 'Inventory', type: 'ASSET' },
  { code: '1300', name: 'Fixed Assets', type: 'ASSET' },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '2100', name: 'VAT Payable', type: 'LIABILITY' },
  { code: '2200', name: 'Income Tax Payable', type: 'LIABILITY' },
  { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY' },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
  { code: '4100', name: 'Other Income', type: 'REVENUE' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE' },
  { code: '6100', name: 'Salaries & Wages', type: 'EXPENSE' },
  { code: '6200', name: 'Rent', type: 'EXPENSE' },
  { code: '6300', name: 'Utilities', type: 'EXPENSE' },
  { code: '7000', name: 'Income Tax Expense', type: 'EXPENSE' },
];

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const accounts = await withTenantContext(session.tenant_id!, async () => {
      const existing = await query('SELECT * FROM chart_of_accounts ORDER BY account_code');
      if (existing.length === 0) {
        for (const a of DEFAULT_ACCOUNTS) {
          await run('INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [session.tenant_id, a.code, a.name, a.type]);
        }
        return await query('SELECT * FROM chart_of_accounts ORDER BY account_code');
      }
      return existing;
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
        `INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, parent_id, description, opening_balance) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [session.tenant_id, body.account_code, body.account_name, body.account_type || 'EXPENSE', body.parent_id || null, body.description || '', Number(body.opening_balance) || 0]
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
      await run('UPDATE chart_of_accounts SET account_code=$1, account_name=$2, account_type=$3, parent_id=$4, description=$5, is_active=$6 WHERE id=$7',
        [body.account_code, body.account_name, body.account_type || 'EXPENSE', body.parent_id || null, body.description || '', body.is_active ?? 1, body.id]);
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
      await run('DELETE FROM chart_of_accounts WHERE id=$1', [id]);
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
