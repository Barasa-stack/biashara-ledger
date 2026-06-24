import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { licenseId, tableName, recordId, action, data } = await request.json();
    if (!tableName || !recordId || !action) {
      return NextResponse.json({ error: 'tableName, recordId, and action required' }, { status: 400 });
    }

    const allowedTables = ['customers', 'sales_invoices', 'quotations', 'payments', 'credit_notes', 'expenses', 'purchase_orders', 'purchase_invoices'];
    if (!allowedTables.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    switch (action) {
      case 'upsert':
        if (!data) return NextResponse.json({ error: 'data required for upsert' }, { status: 400 });
        await run(`INSERT INTO ${tableName} (id, ${Object.keys(data).map(k => `${k}`).join(', ')}) VALUES ($1, ${Object.values(data).map((_, i) => `$${i + 2}`).join(', ')}) ON CONFLICT (id) DO UPDATE SET ${Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ')}`, [recordId, ...Object.values(data)]);
        break;
      case 'delete':
        await run(`DELETE FROM ${tableName} WHERE id = $1`, [recordId]);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    await run('UPDATE sync_queue SET synced_at = NOW() WHERE table_name = $1 AND record_id = $2 AND action = $3', [tableName, recordId, action]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Sync failed' }, { status: 500 });
  }
}

export async function GET() {
  const { query } = await import('@/lib/db');
  const pending = await query('SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC LIMIT 100');
  return NextResponse.json(pending);
}
