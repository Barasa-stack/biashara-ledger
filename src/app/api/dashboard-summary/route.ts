import { NextResponse } from 'next/server';
import { query as dbQuery, get as dbGet, withTenantContext } from '@/lib/db';
import { requireSubscription, AuthError } from '@/lib/auth-guard';

async function safeQuery<T extends object = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    return await dbQuery<T>(sql, params);
  } catch (err: any) {
    console.warn('[dashboard-summary] query failed:', err.message || err, sql.slice(0, 80));
    return [] as T[];
  }
}

async function safeGet<T extends object = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const row = await dbGet<T>(sql, params);
    return new Proxy((row ?? {}) as T, {
      get(target, prop) { return prop in target ? (target as any)[prop] : 0; },
    }) as T;
  } catch (err: any) {
    console.warn('[dashboard-summary] get failed:', err.message || err, sql.slice(0, 80));
    return new Proxy({} as T, { get() { return 0; } }) as T;
  }
}

export async function GET(request: Request) {
  try {
    const { session } = await requireSubscription();
    const { searchParams } = new URL(request.url);
    const year = new Date().getFullYear();
    const from = searchParams.get('from') || `${year}-01-01`;
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const result = await withTenantContext(session.tenant_id!, async () => {
      const [
        grossSales,
        salesReturns,
        discounts,
        purchases,
        debitNotes,
        inventoryRows,
        expensesGrouped,
        salariesTotal,
        otherIncome,
        otherExpenses,
        bankAccounts,
        allPayments,
        allExpenses,
        allSalaries,
        allSupplierPayments,
        allCapitalInjections,
        allWithdrawals,
        allOtherIncome,
        allOtherExpenses,
        accountsReceivable,
        overdueAR,
        accountsPayable,
        overdueAP,
        periodPayments,
        periodSupplierPayments,
        monthlyInflow,
        monthlyOutflow,
        companySettings,
        actualVatOutput,
        actualVatInput,
        fixedAssetsRow,
        cogsFromTransactions,
        lowStockResult,
      ] = await Promise.all([
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(subtotal),0) as total FROM sales_invoices WHERE status!='cancelled' AND issue_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM credit_notes WHERE (status IS NULL OR status!='cancelled') AND issue_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(discounts),0) as total FROM sales_invoices WHERE status!='cancelled' AND issue_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM purchase_invoices WHERE status!='cancelled' AND issue_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM debit_notes WHERE (status IS NULL OR status!='cancelled') AND issue_date BETWEEN $1 AND $2`, [from, to]),
        safeQuery<{ opening_value: number; closing_value: number; count: number }>(
          `SELECT COALESCE(SUM(opening_stock*unit_cost),0) as opening_value, COALESCE(SUM(current_stock*unit_cost),0) as closing_value, COUNT(*) as count FROM inventory_items`),
        safeQuery<{ category: string; total: number }>(
          `SELECT category, COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2 GROUP BY category`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM other_transactions WHERE type='OTHER_INCOME' AND transaction_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM other_transactions WHERE type='OTHER_EXPENSE' AND transaction_date BETWEEN $1 AND $2`, [from, to]),
        safeQuery<{ opening_balance: number }>(
          `SELECT opening_balance FROM bank_accounts WHERE is_active = 1`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM payments`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM salaries WHERE status='paid'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM supplier_payments`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM capital_transactions WHERE type='CAPITAL_INJECTION'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM capital_transactions WHERE type='OWNER_WITHDRAWAL'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM other_transactions WHERE type='OTHER_INCOME'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM other_transactions WHERE type='OTHER_EXPENSE'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount-COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id),0)),0) as total FROM sales_invoices WHERE status IN ('unpaid','partially_paid')`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount-COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id),0)),0) as total FROM sales_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount-COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id),0)),0) as total FROM purchase_invoices WHERE status IN ('unpaid','partially_paid')`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount-COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id),0)),0) as total FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE payment_date BETWEEN $1 AND $2`, [from, to]),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(amount),0) as total FROM supplier_payments WHERE payment_date BETWEEN $1 AND $2`, [from, to]),
        safeQuery<{ m: number; total: number }>(
          `SELECT EXTRACT(MONTH FROM payment_date) as m, COALESCE(SUM(amount),0) as total FROM payments WHERE payment_date BETWEEN $1 AND $2 GROUP BY m ORDER BY m`, [from, to]),
        safeQuery<{ m: number; total: number }>(
          `SELECT EXTRACT(MONTH FROM date) as m, COALESCE(SUM(amount),0) as total FROM (SELECT payment_date as date, amount FROM supplier_payments UNION ALL SELECT expense_date, amount FROM expenses WHERE status='approved' UNION ALL SELECT pay_date, amount FROM salaries WHERE status='paid') c WHERE date BETWEEN $1 AND $2 GROUP BY m ORDER BY m`, [from, to]),
        safeGet<{ base_currency: string; income_tax_rate: number; vat_rate: number }>(
          `SELECT base_currency, income_tax_rate, vat_rate FROM company_settings`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(tax_vat),0) as total FROM sales_invoices WHERE status != 'cancelled'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(tax_vat),0) as total FROM purchase_invoices WHERE status != 'cancelled'`),
        safeQuery<{ total_book_value: number }>(
          `SELECT COALESCE(SUM(book_value),0) as total_book_value FROM fixed_assets WHERE status='active'`),
        safeGet<{ total: number }>(
          `SELECT COALESCE(SUM(total_cost),0) as total FROM inventory_transactions WHERE transaction_type='SALE' AND transaction_date BETWEEN $1 AND $2`, [from, to]),
        safeQuery<{ item_name: string; current_stock: number; reorder_level: number }>(
          `SELECT item_name, current_stock, reorder_level FROM inventory_items WHERE reorder_level > 0 AND current_stock <= reorder_level ORDER BY item_name`),
      ]);

      const gs = Number(grossSales?.total || 0);
      const sr = Number(salesReturns?.total || 0);
      const disc = Number(discounts?.total || 0);
      const netSales = gs - sr - disc;

      const inv = (inventoryRows || []) as any[];
      const openingInv = Number(inv[0]?.opening_value || 0);
      const closingInv = Number(inv[0]?.closing_value || 0);
      const purch = Number(purchases?.total || 0);
      const dn = Number(debitNotes?.total || 0);
      const cogsFromTxns = Number((cogsFromTransactions as any)?.total || 0);
      const costOfGoodsSold = cogsFromTxns || (openingInv + purch - closingInv - dn);

      // Low stock items
      const lowStockItems = (lowStockResult || []) as any[];

      const expRows = (expensesGrouped || []) as any[];
      const expenseTotal = expRows.reduce((s: number, r: any) => s + Number(r.total), 0);
      const salTotal = Number(salariesTotal?.total || 0);
      const oi = Number(otherIncome?.total || 0);
      const oe = Number(otherExpenses?.total || 0);

      const taxRate = Number((companySettings as any)?.income_tax_rate || 0);
      const profitBeforeTax = netSales - costOfGoodsSold - expenseTotal - salTotal + oi - oe;
      const taxes = profitBeforeTax > 0 ? profitBeforeTax * (taxRate / 100) : 0;
      const netProfit = profitBeforeTax - taxes;

      // Cash on Hand = bank opening balances + all cash in - all cash out
      const bankAccountsArr = (bankAccounts || []) as any[];
      const totalBankOpening = bankAccountsArr.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
      const allPmts = Number(allPayments?.total || 0);
      const allExp = Number(allExpenses?.total || 0);
      const allSal = Number(allSalaries?.total || 0);
      const allSupPmts = Number(allSupplierPayments?.total || 0);
      const allCapInj = Number(allCapitalInjections?.total || 0);
      const allWith = Number(allWithdrawals?.total || 0);
      const allOi = Number(allOtherIncome?.total || 0);
      const allOe = Number(allOtherExpenses?.total || 0);

      const cashOnHand = totalBankOpening + allPmts + allCapInj + allOi - allExp - allSal - allSupPmts - allWith - allOe;

      const ar = Number(accountsReceivable?.total || 0);
      const oar = Number(overdueAR?.total || 0);
      const ap = Number(accountsPayable?.total || 0);
      const oap = Number(overdueAP?.total || 0);

      // Inventory value
      const inventoryValue = closingInv;

      // Fixed assets net book value
      const faRow = (fixedAssetsRow || []) as any[];
      const fixedAssetsNet = Number(faRow[0]?.total_book_value || 0);

      // Tax payable (all-time)
      const allTimeVatOut = Number(actualVatOutput?.total || 0);
      const allTimeVatIn = Number(actualVatInput?.total || 0);
      const allTimeVatPayable = Math.max(0, allTimeVatOut - allTimeVatIn);
      const taxPayable = allTimeVatPayable;

      // Current Assets = Cash + AR + Inventory
      const currentAssets = cashOnHand + ar + inventoryValue;

      // Current Liabilities = AP + Tax Payable
      const currentLiabilities = ap + taxPayable;

      const pPayments = Number(periodPayments?.total || 0);
      const pExpenses = expenseTotal;
      const pSalaries = salTotal;
      const pSupPmts = Number(periodSupplierPayments?.total || 0);
      const cashOperatingInflow = pPayments;
      const cashOperatingOutflow = pExpenses + pSalaries + pSupPmts;

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const inByMonth: Record<number, number> = {};
      const outByMonth: Record<number, number> = {};
      for (const r of (monthlyInflow || []) as any[]) inByMonth[Number(r.m)] = Number(r.total);
      for (const r of (monthlyOutflow || []) as any[]) outByMonth[Number(r.m)] = Number(r.total);
      const monthlyCash = months.map((_, i) => {
        const m = i + 1;
        const inc = inByMonth[m] || 0;
        const out = outByMonth[m] || 0;
        return { month: months[i], incoming: inc, outgoing: out, profit: inc - out };
      });

      const baseCurrency = (companySettings as any)?.base_currency || 'KES';

      return {
        totalRevenue: gs,
        totalPurchases: purch,
        totalExpenses: expenseTotal,
        totalSalaries: salTotal,
        totalCost: costOfGoodsSold,
        netProfit,
        netSales,
        cashOperatingInflow,
        cashOperatingOutflow,
        cashOnHand,
        currentAssets,
        currentLiabilities,
        receivables: { total: ar, open: Math.max(0, ar - oar), overdue: oar },
        payables: { total: ap, open: Math.max(0, ap - oap), overdue: oap },
        monthlyCash,
        baseCurrency,
        inventoryValue,
        inventoryItemsCount: Number(inv[0]?.count || 0),
        lowStockItems,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error('[dashboard-summary] Error:', err.message);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
