import { NextResponse } from 'next/server';
import { query, run, insertReturning, get, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function applyWeightedAverageCost(itemId: string, quantity: number, unitCost: number, transactionType: string) {
  const item = await get(
    'SELECT current_stock, unit_cost FROM inventory_items WHERE id=$1',
    [itemId]
  ) as { current_stock: number; unit_cost: number } | undefined;
  if (!item) return;

  if (transactionType === 'PURCHASE') {
    const currentQty = Number(item.current_stock) || 0;
    const currentCost = Number(item.unit_cost) || 0;
    const totalCost = (currentQty * currentCost) + (quantity * unitCost);
    const newQty = currentQty + quantity;
    const weightedAvgCost = newQty > 0 ? totalCost / newQty : 0;
    await run('UPDATE inventory_items SET current_stock=$1, unit_cost=$2 WHERE id=$3', [newQty, weightedAvgCost, itemId]);
  } else if (transactionType === 'SALE') {
    const newQty = Math.max(0, Number(item.current_stock) - quantity);
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  } else if (transactionType === 'RETURN') {
    const newQty = Number(item.current_stock) + quantity;
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  } else if (transactionType === 'ADJUSTMENT') {
    const newQty = Math.max(0, Number(item.current_stock) + quantity);
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  }
}

async function createInventoryJournal(tenantId: string, itemId: string, transactionType: string, quantity: number, unitCost: number, totalCost: number, transactionDate: string) {
  const item = await get('SELECT item_name, sku FROM inventory_items WHERE id=$1', [itemId]) as any;
  if (!item) return;
  const itemName = item.item_name || 'Unknown';
  const description = `[Auto] ${transactionType} - ${itemName} (${item.sku || 'no SKU'}) x${quantity} @ ${unitCost}`;

  const accounts = await query(`SELECT account_code, id FROM chart_of_accounts WHERE account_code IN ('1200','5000','2000','1000','3000')`) as any[];
  const findId = (code: string) => accounts.find((a: any) => a.account_code === code)?.id;
  const invId = findId('1200');
  const cogsId = findId('5000');
  const apId = findId('2000');
  const cashId = findId('1000');
  const equityId = findId('3000');
  if (!invId || !cogsId) return;

  const entryNum = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
  const entry = await insertReturning<{ id: string }>(
    `INSERT INTO journal_entries (tenant_id, entry_number, description, entry_date, reference, status) VALUES ($1,$2,$3,$4,$5,'posted') RETURNING id`,
    [tenantId, entryNum, description, transactionDate, `item:${itemId}`]
  );
  const jeId = entry.id;

  if (transactionType === 'PURCHASE' && apId) {
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, invId, description, totalCost, 0]);
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, apId, description, 0, totalCost]);
  } else if (transactionType === 'SALE') {
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, cogsId, description, totalCost, 0]);
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, invId, description, 0, totalCost]);
  } else if (transactionType === 'RETURN') {
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, invId, description, totalCost, 0]);
    await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, cogsId, description, 0, totalCost]);
  } else if (transactionType === 'ADJUSTMENT') {
    if (quantity > 0) {
      await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, invId, description, totalCost, 0]);
      const creditId = equityId || cogsId;
      await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, creditId, description, 0, totalCost]);
    } else {
      await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, cogsId, description, Math.abs(totalCost), 0]);
      await run('INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount) VALUES ($1,$2,$3,$4,$5,$6)', [tenantId, jeId, invId, description, 0, Math.abs(totalCost)]);
    }
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const transactions = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT t.*, i.item_name, i.sku
        FROM inventory_transactions t
        JOIN inventory_items i ON i.id = t.item_id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 500
      `);
    });
    return NextResponse.json(transactions);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
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
      const qty = Number(body.quantity) || 0;
      const cost = Number(body.unit_cost) || 0;
      const total = qty * cost;
      const txnDate = body.transaction_date || new Date().toISOString().split('T')[0];

      await applyWeightedAverageCost(body.item_id, qty, cost, body.transaction_type);

      const txn = await insertReturning<{ id: string }>(
        `INSERT INTO inventory_transactions (tenant_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, transaction_date, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [session.tenant_id, body.item_id, body.transaction_type || 'PURCHASE', qty, cost, total,
         body.reference_type || '', body.reference_id || '', txnDate, body.notes || '']
      );

      await createInventoryJournal(session.tenant_id, body.item_id, body.transaction_type, qty, cost, total, txnDate);

      try {
        const item = await get(
          'SELECT item_name, current_stock, reorder_level FROM inventory_items WHERE id=$1',
          [body.item_id]
        ) as { item_name: string; current_stock: number; reorder_level: number } | undefined;
        if (item && Number(item.reorder_level) > 0 && Number(item.current_stock) <= Number(item.reorder_level)) {
          const message = `${item.item_name} is running low (${item.current_stock} remaining, reorder at ${item.reorder_level})`;
          await run(
            'INSERT INTO notification_log (tenant_id, user_id, notification_type, title, message, channel) VALUES ($1, NULL, $2, $3, $4, $5)',
            [session.tenant_id, 'low_stock', 'Low Stock Alert', message, 'in_app']
          );
        }
      } catch (_) {}

      return txn;
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
