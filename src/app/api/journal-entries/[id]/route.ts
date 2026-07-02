import { NextResponse } from 'next/server';
import { query, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const result = await withTenantContext(session.tenant_id!, async () => {
      const entry = await query('SELECT * FROM journal_entries WHERE id=$1', [id]);
      const lines = await query(`
        SELECT jel.*, coa.account_code, coa.account_name, coa.account_type
        FROM journal_entry_lines jel
        LEFT JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE jel.journal_entry_id=$1 ORDER BY jel.id`, [id]);
      return { entry: entry[0] || null, lines };
    });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
