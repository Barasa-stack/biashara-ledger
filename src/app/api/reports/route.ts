import { NextResponse } from 'next/server';
import { query as dbQuery, get as dbGet, run as dbRun, withTenantContext } from '@/lib/db';
import { requireSubscription, AuthError } from '@/lib/auth-guard';
import { convert, periodSum } from '@/lib/currency';

const reportCache = new Map<string, any>();
const CACHE_TTL = 60_000;

function getCached(key: string): any | undefined {
  const entry = reportCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL) { reportCache.delete(key); return undefined; }
  return entry.data;
}

function setCache(key: string, data: any) {
  if (reportCache.size > 50) {
    const oldest = reportCache.keys().next().value;
    if (oldest) reportCache.delete(oldest);
  }
  reportCache.set(key, { data, ts: Date.now() });
}

async function safeQuery<T extends object = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    return await dbQuery<T>(sql, params);
  } catch (err: any) {
    console.warn('[reports] query failed:', err.message || err, sql, params);
    return [] as T[];
  }
}

async function safeGet<T extends object = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const row = await dbGet<T>(sql, params);
    return new Proxy((row ?? {}) as T, {
      get(target, prop) {
        return prop in target ? (target as any)[prop] : 0;
      },
    }) as T;
  } catch (err: any) {
    console.warn('[reports] get failed:', err.message || err, sql, params);
    return new Proxy({} as T, {
      get() {
        return 0;
      },
    }) as T;
  }
}

function monthsBetween(from: string, to: string): number {
  const f = new Date(from);
  const t = new Date(to);
  return Math.max(1, (t.getFullYear() - f.getFullYear()) * 12 + t.getMonth() - f.getMonth() + 1);
}

export async function GET(request: Request) {
  try {
    const { session } = await requireSubscription();
    const { searchParams } = new URL(request.url);
  const year = new Date().getFullYear();
  const from = searchParams.get('from') || `${year}-01-01`;
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

  // Prior period for comparative reports
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const periodDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000));
  const priorToDate = new Date(fromDate.getTime() - 86400000);
  const priorFromDate = new Date(priorToDate.getTime() - periodDays * 86400000 + 86400000);
  const priorFrom = priorFromDate.toISOString().split('T')[0];
  const priorTo = priorToDate.toISOString().split('T')[0];

  const cacheKey = `reports:${session.tenant_id}:${from}:${to}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  const reportData = await withTenantContext(session.tenant_id!, async () => {

  // ═══════════════════════════════════════════════
  // PROFIT & LOSS STATEMENT — dual-period + multi-currency
  // ═══════════════════════════════════════════════
  const pnlSales = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $1 AND $2 THEN ${convert('subtotal')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $3 AND $4 THEN ${convert('subtotal')} ELSE 0 END), 0) as pri
    FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlReturns = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM credit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlDiscounts = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $1 AND $2 THEN ${convert('discounts')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $3 AND $4 THEN ${convert('discounts')} ELSE 0 END), 0) as pri
    FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlPurchases = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlDebitNotes = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN issue_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM debit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlExpenses = await safeQuery(`
    SELECT category,
      COALESCE(SUM(CASE WHEN expense_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN expense_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM expenses WHERE status='approved' AND expense_date BETWEEN $3 AND $2
    GROUP BY category ORDER BY cur DESC
  `, [from, to, priorFrom, priorTo]) as { category: string; cur: number; pri: number }[];

  const pnlSalaries = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN pay_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN pay_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM salaries WHERE status='paid' AND pay_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlOtherIncome = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM other_transactions WHERE type='OTHER_INCOME' AND transaction_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const pnlOtherExpenses = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM other_transactions WHERE type='OTHER_EXPENSE' AND transaction_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  // Assemble P&L
  const grossSalesCur = pnlSales.cur;
  const grossSalesPri = pnlSales.pri;
  const salesReturnsCur = pnlReturns.cur;
  const salesReturnsPri = pnlReturns.pri;
  const discountsCur = pnlDiscounts.cur;
  const discountsPri = pnlDiscounts.pri;
  const allowances = 0;
  const netSalesCur = grossSalesCur - salesReturnsCur - discountsCur - allowances;
  const netSalesPri = grossSalesPri - salesReturnsPri - discountsPri;

  // Cost of Goods Sold — Perpetual method using inventory_transactions
  const cogsTransactions = await safeQuery(`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $1 AND $2 AND transaction_type='SALE' THEN total_cost ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN transaction_date BETWEEN $3 AND $4 AND transaction_type='SALE' THEN total_cost ELSE 0 END), 0) as pri
    FROM inventory_transactions WHERE transaction_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as any;
  const cogsFromTransactionsCur = Number((cogsTransactions[0] as any)?.cur || 0);
  const cogsFromTransactionsPri = Number((cogsTransactions[0] as any)?.pri || 0);

  const inventoryItems = await safeQuery(
    `SELECT COALESCE(SUM(opening_stock * unit_cost), 0) as opening_value, 
            COALESCE(SUM(current_stock * unit_cost), 0) as closing_value
     FROM inventory_items`
  ) as any;
  const openingInventory = inventoryItems[0]?.opening_value ?? 0;
  const closingInventory = inventoryItems[0]?.closing_value ?? 0;

  const purchasesCur = pnlPurchases.cur;
  const purchasesPri = pnlPurchases.pri;
  const debitNotesCur = pnlDebitNotes.cur;
  const debitNotesPri = pnlDebitNotes.pri;
  const directCosts = 0;
  const periodicCogsCur = openingInventory + purchasesCur + directCosts - closingInventory - debitNotesCur;
  const periodicCogsPri = openingInventory + purchasesPri + directCosts - closingInventory - debitNotesPri;
  // Prefer perpetual (from actual transactions), fallback to periodic
  const costOfGoodsSoldCur = cogsFromTransactionsCur || periodicCogsCur;
  const costOfGoodsSoldPri = cogsFromTransactionsPri || periodicCogsPri;

  // Inventory valuation detail
  const inventoryItemsDetail = await safeQuery(
    `SELECT id, item_name, sku, category, unit_of_measure, current_stock, unit_cost, (current_stock * unit_cost) as total_value
     FROM inventory_items WHERE current_stock > 0 ORDER BY item_name`
  ) as any[];
  const totalInventoryItems = inventoryItemsDetail.length;
  const totalInventoryValue = inventoryItemsDetail.reduce((s: number, i: any) => s + Number(i.total_value), 0);
  const grossProfitCur = netSalesCur - costOfGoodsSoldCur;
  const grossProfitPri = netSalesPri - costOfGoodsSoldPri;

  // Operating Expenses classification (dual-period)
  const adminKeywords = ['office supplies', 'insurance', 'software', 'subscription', 'professional fees', 'communication', 'utilities', 'services', 'consulting'];
  const sellingKeywords = ['marketing', 'travel', 'transport', 'meals', 'entertainment', 'logistics', 'advertising', 'promotion'];
  const generalKeywords = ['rent', 'maintenance', 'equipment', 'repair', 'cleaning'];

  let adminExpensesCur = 0, sellingExpensesCur = 0, generalExpensesCur = 0;
  let adminExpensesPri = 0, sellingExpensesPri = 0, generalExpensesPri = 0;
  const expenseMap: Record<string, { cur: number; pri: number }> = {};

  for (const e of pnlExpenses) {
    expenseMap[e.category] = { cur: e.cur, pri: e.pri };
    const cat = e.category.toLowerCase();
    if (generalKeywords.some(k => cat.includes(k))) {
      generalExpensesCur += e.cur; generalExpensesPri += e.pri;
    } else if (sellingKeywords.some(k => cat.includes(k))) {
      sellingExpensesCur += e.cur; sellingExpensesPri += e.pri;
    } else {
      adminExpensesCur += e.cur; adminExpensesPri += e.pri;
    }
  }

  const salariesCur = pnlSalaries.cur;
  const salariesPri = pnlSalaries.pri;

  // Depreciation expense for the period
  const fixedAssetsForDepreciation = await safeQuery(
    `SELECT id, purchase_cost, salvage_value, useful_life_years, purchase_date, accumulated_depreciation, book_value
     FROM fixed_assets WHERE status='active'`
  ) as any[];
  const periodMonths = monthsBetween(from, to);
  const priorPeriodMonths = monthsBetween(priorFrom, priorTo);
  let depreciationCur = 0;
  let depreciationPri = 0;
  for (const fa of fixedAssetsForDepreciation) {
    const cost = Number(fa.purchase_cost);
    const salvage = Number(fa.salvage_value ?? 0);
    const life = Number(fa.useful_life_years ?? 5);
    if (life <= 0 || cost <= 0) continue;
    const annualDep = (cost - salvage) / life;
    const monthlyDep = annualDep / 12;
    const pd = fa.purchase_date ? new Date(fa.purchase_date) : null;
    let curMonths = periodMonths;
    let priMonths = priorPeriodMonths;
    if (pd) {
      if (pd > new Date(to)) { curMonths = 0; priMonths = 0; }
      else if (pd > new Date(from)) curMonths = Math.max(0, monthsBetween(fa.purchase_date, to));
      else if (pd > new Date(priorFrom) && pd <= new Date(from)) { priMonths = Math.max(0, monthsBetween(fa.purchase_date, priorTo)); curMonths = periodMonths; }
      else if (pd > new Date(priorTo)) { priMonths = 0; }
    }
    depreciationCur += monthlyDep * curMonths;
    depreciationPri += monthlyDep * priMonths;
  }

  const totalOpExCur = adminExpensesCur + sellingExpensesCur + generalExpensesCur + salariesCur + depreciationCur;
  const totalOpExPri = adminExpensesPri + sellingExpensesPri + generalExpensesPri + salariesPri + depreciationPri;
  const opProfitCur = grossProfitCur - totalOpExCur;
  const opProfitPri = grossProfitPri - totalOpExPri;
  const ebitdaCur = opProfitCur + depreciationCur;
  const ebitdaPri = opProfitPri + depreciationPri;

  const otherIncomeCur = pnlOtherIncome.cur;
  const otherIncomePri = pnlOtherIncome.pri;
  const otherExpensesCur = pnlOtherExpenses.cur;
  const otherExpensesPri = pnlOtherExpenses.pri;

  const companySettings = await safeGet('SELECT vat_rate, income_tax_rate, base_currency FROM company_settings') as { vat_rate: number; income_tax_rate: number; base_currency: string } | undefined;
  const incomeTaxRate = companySettings?.income_tax_rate ?? 0;
  const baseCurrency = (companySettings as any)?.base_currency || 'KES';

  const pbtCur = opProfitCur + otherIncomeCur - otherExpensesCur;
  const pbtPri = opProfitPri + otherIncomePri - otherExpensesPri;
  const taxesCur = pbtCur > 0 ? pbtCur * (incomeTaxRate / 100) : 0;
  const taxesPri = pbtPri > 0 ? pbtPri * (incomeTaxRate / 100) : 0;
  const netProfitCur = pbtCur - taxesCur;
  const netProfitPri = pbtPri - taxesPri;

  // Legacy single-period field names (current period values, backward compat)
  const grossSales = grossSalesCur;
  const salesReturns = salesReturnsCur;
  const discounts = discountsCur;
  const netSales = netSalesCur;
  const purchases = { total: purchasesCur };
  const debitNotes = { total: debitNotesCur };
  const costOfGoodsSold = costOfGoodsSoldCur;
  const grossProfit = grossProfitCur;
  const adminExpenses = adminExpensesCur;
  const sellingDistributionExpenses = sellingExpensesCur;
  const generalOperatingExpenses = generalExpensesCur;
  const salariesTotal = { total: salariesCur };
  const depreciationExpense = depreciationCur;
  const totalOperatingExpenses = totalOpExCur;
  const operatingProfit = opProfitCur;
  const ebitda = ebitdaCur;
  const otherIncome = otherIncomeCur;
  const otherExpenses = otherExpensesCur;
  const profitBeforeTax = pbtCur;
  const taxes = taxesCur;
  const netProfit = netProfitCur;
  const expenseTotal = pnlExpenses.reduce((s, e) => s + e.cur, 0);
  const operatingExpenses = expenseTotal + salariesCur + depreciationCur;
  const expenseByCategory = pnlExpenses.map((e: any) => ({ category: e.category, total: e.cur, count: 0 }));
  const salariesDetail = { total: salariesCur, count: 0 };

  // ═══════════════════════════════════════════════
  // BALANCE SHEET (cumulative snapshot with multi-currency)
  // ═══════════════════════════════════════════════
  const bankAccounts = await safeQuery(
    `SELECT id, opening_balance, currency FROM bank_accounts WHERE is_active = 1`
  ) as any[];
  const totalBankOpeningBalance = bankAccounts.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);

  // All-time cash transactions (multi-currency)
  const allPayments = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM payments`
  ) as { total: number };
  const allApprovedExpenses = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM expenses WHERE status='approved'`
  ) as { total: number };
  const allPaidSalaries = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM salaries WHERE status='paid'`
  ) as { total: number };
  const allSupplierPayments = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM supplier_payments`
  ) as { total: number };
  const allCapitalInjections = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM capital_transactions WHERE type='CAPITAL_INJECTION'`
  ) as { total: number };
  const allWithdrawals = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM capital_transactions WHERE type='OWNER_WITHDRAWAL'`
  ) as { total: number };
  const allOtherIncome = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM other_transactions WHERE type='OTHER_INCOME'`
  ) as { total: number };
  const allOtherExpenses = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM other_transactions WHERE type='OTHER_EXPENSE'`
  ) as { total: number };

  // Cash on Hand = bank opening balances + all cash received - all cash paid (all converted to KES)
  const cashOnHand = totalBankOpeningBalance
    + allPayments.total
    + allCapitalInjections.total
    + allOtherIncome.total
    - allApprovedExpenses.total
    - allPaidSalaries.total
    - allSupplierPayments.total
    - allWithdrawals.total
    - allOtherExpenses.total;

  // Accounts Receivable / Payable (multi-currency)
  const accountsReceivable = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 's')}) FROM payments s WHERE s.invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAR = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 's')}) FROM payments s WHERE s.invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  const accountsPayable = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 's')}) FROM supplier_payments s WHERE s.invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAP = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 's')}) FROM supplier_payments s WHERE s.invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  // All-time P&L for retained earnings (multi-currency)
  const allRevenue = await safeGet(
    `SELECT COALESCE(SUM(${convert('subtotal')}), 0) as total FROM sales_invoices WHERE status != 'cancelled'`
  ) as { total: number };
  const allCreditNotes = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM credit_notes WHERE (status IS NULL OR status != 'cancelled')`
  ) as { total: number };
  const allPurchases = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM purchase_invoices WHERE status != 'cancelled'`
  ) as { total: number };
  const allDebitNotes = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM debit_notes WHERE (status IS NULL OR status != 'cancelled')`
  ) as { total: number };
  const allExpensesTotal = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM expenses WHERE status='approved'`
  ) as { total: number };
  const allSalaries = await safeGet(
    `SELECT COALESCE(SUM(${convert('amount')}), 0) as total FROM salaries WHERE status='paid'`
  ) as { total: number };

  const allDepreciation = fixedAssetsForDepreciation.reduce((s: number, fa: any) => {
    return s + Number(fa.accumulated_depreciation ?? 0);
  }, 0);

  const retainedEarnings = (allRevenue.total - allCreditNotes.total + allDebitNotes.total)
    - allPurchases.total
    - allExpensesTotal.total
    - allSalaries.total
    - allDepreciation
    + allOtherIncome.total
    - allOtherExpenses.total;

  const totalCapitalInjections = allCapitalInjections.total;
  const totalWithdrawals = allWithdrawals.total;
  const inventoryValue = totalInventoryValue;

  const fixedAssetsData = await safeQuery(
    `SELECT COUNT(*) as count, COALESCE(SUM(purchase_cost),0) as total_cost,
            COALESCE(SUM(accumulated_depreciation),0) as total_depreciation,
            COALESCE(SUM(book_value),0) as total_book_value
     FROM fixed_assets WHERE status='active'`
  ) as any[];
  const faRow = fixedAssetsData[0] || { count: 0, total_cost: 0, total_depreciation: 0, total_book_value: 0 };

  // All-time VAT (tax_vat is always in KES, no currency conversion needed)
  const allTimeVatOutput = await safeGet(
    `SELECT COALESCE(SUM(tax_vat), 0) as total FROM sales_invoices WHERE status != 'cancelled'`
  ) as { total: number };
  const allTimeVatInput = await safeGet(
    `SELECT COALESCE(SUM(tax_vat), 0) as total FROM purchase_invoices WHERE status != 'cancelled'`
  ) as { total: number };
  const allTimeVatPayable = allTimeVatOutput.total - allTimeVatInput.total;

  // All-time income tax
  const allTimeRevenue = allRevenue.total;
  const allTimeCreditNotes = allCreditNotes.total;
  const allTimePurchases = allPurchases.total;
  const allTimeDebitNotes = allDebitNotes.total;
  const allTimeExpenses = allExpensesTotal.total;
  const allTimeSalaries = allSalaries.total;
  const allTimeOtherIncome = allOtherIncome.total;
  const allTimeOtherExpenses = allOtherExpenses.total;
  const allTimeProfitBeforeTax = (allTimeRevenue - allTimeCreditNotes + allTimeDebitNotes) - allTimePurchases - allTimeExpenses - allTimeSalaries - allDepreciation + allTimeOtherIncome - allTimeOtherExpenses;
  const allTimeIncomeTaxAccrued = allTimeProfitBeforeTax > 0 ? allTimeProfitBeforeTax * (incomeTaxRate / 100) : 0;

  const vatPayableBalance = Math.max(0, allTimeVatPayable);
  const incomeTaxPayable = Math.max(0, allTimeIncomeTaxAccrued);
  const taxPayable = vatPayableBalance + incomeTaxPayable;

  const currentAssets = cashOnHand + accountsReceivable.total + inventoryValue;
  const nonCurrentAssets = Number(faRow.total_book_value);
  const totalAssets = currentAssets + nonCurrentAssets;
  const currentLiabilities = accountsPayable.total + taxPayable;
  const nonCurrentLiabilities = 0;
  const totalLiabilities = currentLiabilities + nonCurrentLiabilities;
  const totalEquity = retainedEarnings + totalCapitalInjections - totalWithdrawals;
  const balanceCheck = totalAssets - totalLiabilities - totalEquity;

  // ═══════════════════════════════════════════════
  // RECEIVABLES
  // ═══════════════════════════════════════════════
  const unpaidInvoices = accountsReceivable;
  const overdueInvoices = overdueAR;
  const openReceivables = unpaidInvoices.total - overdueInvoices.total;

  // ═══════════════════════════════════════════════
  // PAYABLES
  // ═══════════════════════════════════════════════
  const unpaidBills = accountsPayable;
  const overdueBills = overdueAP;
  const openPayables = unpaidBills.total - overdueBills.total;

  // ═══════════════════════════════════════════════
  // CASH FLOW — dual-period + multi-currency
  // ═══════════════════════════════════════════════
  const cfPayments = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN payment_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN payment_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM payments WHERE payment_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const cfExpenses = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN expense_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN expense_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM expenses WHERE status='approved' AND expense_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const cfSalaries = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN pay_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN pay_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM salaries WHERE status='paid' AND pay_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const cfSupplierPayments = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN payment_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as cur,
      COALESCE(SUM(CASE WHEN payment_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as pri
    FROM supplier_payments WHERE payment_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { cur: number; pri: number };

  const cashOperatingInflowCur = cfPayments.cur;
  const cashOperatingInflowPri = cfPayments.pri;
  const cashOperatingOutflowCur = cfExpenses.cur + cfSalaries.cur + cfSupplierPayments.cur;
  const cashOperatingOutflowPri = cfExpenses.pri + cfSalaries.pri + cfSupplierPayments.pri;
  const netOperatingCashFlowCur = cashOperatingInflowCur - cashOperatingOutflowCur;
  const netOperatingCashFlowPri = cashOperatingInflowPri - cashOperatingOutflowPri;

  // Investing — fixed_assets don't have currency columns
  const investingInflow = await safeGet(
    `SELECT COALESCE(SUM(disposal_amount), 0) as total FROM fixed_assets WHERE disposal_date BETWEEN $1 AND $2 AND disposal_amount > 0`,
    [from, to]
  ) as { total: number };
  const investingOutflow = await safeGet(
    `SELECT COALESCE(SUM(purchase_cost), 0) as total FROM fixed_assets WHERE purchase_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };
  const netInvestingCashFlow = investingInflow.total - investingOutflow.total;

  // Financing — capital_transactions has currency columns
  const cfFinancing = await safeGet(`
    SELECT
      COALESCE(SUM(CASE WHEN type='CAPITAL_INJECTION' AND transaction_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as inflowCur,
      COALESCE(SUM(CASE WHEN type='OWNER_WITHDRAWAL' AND transaction_date BETWEEN $1 AND $2 THEN ${convert('amount')} ELSE 0 END), 0) as outflowCur,
      COALESCE(SUM(CASE WHEN type='CAPITAL_INJECTION' AND transaction_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as inflowPri,
      COALESCE(SUM(CASE WHEN type='OWNER_WITHDRAWAL' AND transaction_date BETWEEN $3 AND $4 THEN ${convert('amount')} ELSE 0 END), 0) as outflowPri
    FROM capital_transactions WHERE transaction_date BETWEEN $3 AND $2
  `, [from, to, priorFrom, priorTo]) as { inflowCur: number; outflowCur: number; inflowPri: number; outflowPri: number };

  const netFinancingCashFlowCur = cfFinancing.inflowCur - cfFinancing.outflowCur;
  const netFinancingCashFlowPri = cfFinancing.inflowPri - cfFinancing.outflowPri;
  const netCashFlowCur = netOperatingCashFlowCur + netInvestingCashFlow + netFinancingCashFlowCur;
  const netCashFlowPri = netOperatingCashFlowPri + netInvestingCashFlow + netFinancingCashFlowPri;

  // Legacy single-period fields
  const cashOperatingInflow = cashOperatingInflowCur;
  const cashOperatingOutflow = cashOperatingOutflowCur;
  const netOperatingCashFlow = netOperatingCashFlowCur;
  const cashSupplierPayments = cfSupplierPayments.cur;
  const cashExpensePayments = cfExpenses.cur;
  const cashSalaryPayments = cfSalaries.cur;
  const netFinancingCashFlow = netFinancingCashFlowCur;
  const netCashFlow = netCashFlowCur;

  // Monthly cash flow (current period only, multi-currency)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyInflow = await safeQuery(
    `SELECT EXTRACT(MONTH FROM payment_date) as m, COALESCE(SUM(${convert('amount')}),0) as total FROM payments 
     WHERE payment_date BETWEEN $1 AND $2 GROUP BY m ORDER BY m`,
    [from, to]
  ) as { m: number; total: number }[];
  const monthlyOutflow = await safeQuery(
    `SELECT EXTRACT(MONTH FROM date) as m, COALESCE(SUM(amount),0) as total FROM (
      SELECT payment_date as date, ${convert('amount')} as amount FROM supplier_payments
      UNION ALL SELECT expense_date, ${convert('amount')} FROM expenses WHERE status='approved'
      UNION ALL SELECT pay_date, ${convert('amount')} FROM salaries WHERE status='paid'
    ) c WHERE date BETWEEN $1 AND $2 GROUP BY m ORDER BY m`,
    [from, to]
  ) as { m: number; total: number }[];
  const inflowByMonth: Record<number, number> = {};
  const outflowByMonth: Record<number, number> = {};
  for (const r of monthlyInflow) inflowByMonth[r.m] = r.total;
  for (const r of monthlyOutflow) outflowByMonth[r.m] = r.total;
  const monthlyCash = months.map((month, i) => {
    const m = i + 1;
    const inc = inflowByMonth[m] || 0;
    const out = outflowByMonth[m] || 0;
    return { month, incoming: inc, outgoing: out, profit: inc - out };
  });

  // ═══════════════════════════════════════════════
  // TRIAL BALANCE (all converted to KES)
  // ═══════════════════════════════════════════════
  const tbOtherIncome = allOtherIncome;
  const tbOtherExpenses = allOtherExpenses;

  const tbDebits = allCreditNotes.total + allPurchases.total + allExpensesTotal.total + allSalaries.total + allDepreciation
    + accountsReceivable.total + Math.max(0, cashOnHand) + inventoryValue + Number(faRow.total_book_value)
    + tbOtherExpenses.total + totalWithdrawals;
  const tbCredits = allRevenue.total + allDebitNotes.total + accountsPayable.total + taxPayable
    + tbOtherIncome.total + totalCapitalInjections;
  const tbEquity = tbDebits - tbCredits;

  const trialBalance = [
    { account: 'Revenue/Sales', type: 'Credit', balance: allRevenue.total },
    { account: 'Credit Notes (Returns)', type: 'Debit', balance: allCreditNotes.total },
    { account: 'Cost of Sales (Purchases)', type: 'Debit', balance: allPurchases.total },
    { account: 'Debit Notes (Purchase Returns)', type: 'Credit', balance: allDebitNotes.total },
    { account: 'Operating Expenses', type: 'Debit', balance: allExpensesTotal.total },
    { account: 'Salaries & Wages', type: 'Debit', balance: allSalaries.total },
    { account: 'Depreciation', type: 'Debit', balance: allDepreciation },
    { account: 'Accounts Receivable', type: 'Debit', balance: accountsReceivable.total },
    { account: 'Inventory', type: 'Debit', balance: inventoryValue },
    { account: 'Fixed Assets (Net)', type: 'Debit', balance: Number(faRow.total_book_value) },
    { account: 'Accounts Payable', type: 'Credit', balance: accountsPayable.total },
    { account: 'Tax Payable', type: 'Credit', balance: taxPayable },
    { account: 'Cash at Bank', type: 'Debit', balance: Math.max(0, cashOnHand) },
    { account: 'Other Income', type: 'Credit', balance: tbOtherIncome.total },
    { account: 'Other Expenses', type: 'Debit', balance: tbOtherExpenses.total },
    { account: 'Capital Contributions', type: 'Credit', balance: totalCapitalInjections },
    { account: 'Owner Withdrawals', type: 'Debit', balance: totalWithdrawals },
    { account: 'Retained Earnings', type: tbEquity >= 0 ? 'Credit' : 'Debit', balance: Math.abs(tbEquity) },
  ];

  // ═══════════════════════════════════════════════
  // GENERAL LEDGER
  // ═══════════════════════════════════════════════
  const glPayments = await safeQuery(
    `SELECT p.id, 'Payment' as type, ${convert('p.amount', 'p')} as amount, p.payment_method as detail, p.payment_date as date, p.created_at FROM payments p WHERE p.payment_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glExpenses = await safeQuery(
    `SELECT e.id, 'Expense' as type, ${convert('e.amount', 'e')} as amount, e.category as detail, e.expense_date as date, e.created_at FROM expenses e WHERE e.status='approved' AND e.expense_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glSalaries = await safeQuery(
    `SELECT s.id, 'Salary' as type, ${convert('s.amount', 's')} as amount, e.name as detail, s.pay_date as date, s.created_at FROM salaries s JOIN employees e ON e.id=s.employee_id WHERE s.status='paid' AND s.pay_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glPurchases = await safeQuery(
    `SELECT pi.id, 'Purchase Invoice' as type, ${convert('pi.amount', 'pi')} as amount, c.company_name as detail, pi.issue_date as date, pi.created_at FROM purchase_invoices pi JOIN clients c ON c.id=pi.client_id WHERE pi.issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glSalesInvoices = await safeQuery(
    `SELECT si.id, 'Sales Invoice' as type, ${convert('si.amount', 'si')} as amount, cu.company_name as detail, si.issue_date as date, si.created_at FROM sales_invoices si JOIN customers cu ON cu.id=si.customer_id WHERE si.issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glCreditNotes = await safeQuery(
    `SELECT cn.id, 'Credit Note' as type, ${convert('cn.amount', 'cn')} as amount, cn.reason as detail, cn.issue_date as date, cn.created_at FROM credit_notes cn WHERE (cn.status IS NULL OR cn.status != 'cancelled') AND cn.issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glDebitNotes = await safeQuery(
    `SELECT dn.id, 'Debit Note' as type, ${convert('dn.amount', 'dn')} as amount, dn.reason as detail, dn.issue_date as date, dn.created_at FROM debit_notes dn WHERE (dn.status IS NULL OR dn.status != 'cancelled') AND dn.issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glSupplierPayments = await safeQuery(
    `SELECT sp.id, 'Supplier Payment' as type, ${convert('sp.amount', 'sp')} as amount, c.company_name as detail, sp.payment_date as date, sp.created_at FROM supplier_payments sp JOIN purchase_invoices pi ON pi.id=sp.invoice_id JOIN clients c ON c.id=pi.client_id WHERE sp.payment_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];

  const glOtherTransactions = await safeQuery(
    `SELECT id, type as tx_type, ${convert('amount')} as amount, category as detail, transaction_date as date, created_at FROM other_transactions WHERE transaction_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glOtherIncome = glOtherTransactions
    .filter((t: any) => t.tx_type === 'OTHER_INCOME')
    .map((t: any) => ({ ...t, type: 'Other Income' }));
  const glOtherExpenses = glOtherTransactions
    .filter((t: any) => t.tx_type === 'OTHER_EXPENSE')
    .map((t: any) => ({ ...t, type: 'Other Expense' }));

  const glCapitalTxns = await safeQuery(
    `SELECT id, type as tx_type, ${convert('amount')} as amount, description as detail, transaction_date as date, created_at FROM capital_transactions WHERE transaction_date BETWEEN $1 AND $2`,
    [from, to]
  ) as any[];
  const glCapitalInjections = glCapitalTxns
    .filter((t: any) => t.tx_type === 'CAPITAL_INJECTION')
    .map((t: any) => ({ ...t, type: 'Capital Injection' }));
  const glOwnerWithdrawals = glCapitalTxns
    .filter((t: any) => t.tx_type === 'OWNER_WITHDRAWAL')
    .map((t: any) => ({ ...t, type: 'Owner Withdrawal' }));

  const allGlEntries = [...glPayments, ...glExpenses, ...glSalaries, ...glPurchases, ...glSalesInvoices, ...glCreditNotes, ...glDebitNotes, ...glSupplierPayments, ...glOtherIncome, ...glOtherExpenses, ...glCapitalInjections, ...glOwnerWithdrawals]
    .sort((a, b) => (a.date || a.created_at) > (b.date || b.created_at) ? 1 : -1);
  let runningBal = 0;
  const generalLedger = allGlEntries.slice(0, 200).map(entry => {
    runningBal += Number(entry.amount);
    return { ...entry, runningBalance: runningBal };
  });

  // ═══════════════════════════════════════════════
  // AGING
  // ═══════════════════════════════════════════════
  const agingBuckets = [
    { label: '0–30 days', min: 0, max: 30 },
    { label: '31–60 days', min: 31, max: 60 },
    { label: '61–90 days', min: 61, max: 90 },
    { label: '90+ days', min: 90, max: 999999 },
  ];

  const receivablesAging = await Promise.all(agingBuckets.map(async (b) => {
    const r = await safeGet(
      `SELECT 
        COALESCE(SUM(GREATEST(0, ${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 'p')}) FROM payments p WHERE p.invoice_id=sales_invoices.id), 0))), 0) as total,
        COUNT(*) as count
       FROM sales_invoices WHERE status IN ('unpaid','partially_paid') 
       AND (CURRENT_DATE - NULLIF(due_date,'')::date) BETWEEN $1 AND $2`,
      [b.min, b.max]
     ) as { total: number; count: number };
     return { bucket: b.label, total: r.total, count: r.count };
   }));

   const payablesAging = await Promise.all(agingBuckets.map(async (b) => {
     const r = await safeGet(
       `SELECT 
         COALESCE(SUM(GREATEST(0, ${convert('amount')} - COALESCE((SELECT SUM(${convert('amount', 'p')}) FROM supplier_payments p WHERE p.invoice_id=purchase_invoices.id), 0))), 0) as total,
         COUNT(*) as count
        FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') 
        AND (CURRENT_DATE - NULLIF(due_date,'')::date) BETWEEN $1 AND $2`,
      [b.min, b.max]
    ) as { total: number; count: number };
    return { bucket: b.label, total: r.total, count: r.count };
  }));

  // ═══════════════════════════════════════════════
  // SALES BY CUSTOMER (multi-currency)
  // ═══════════════════════════════════════════════
  const salesByCustomer = await safeQuery(`
    SELECT cu.company_name, COALESCE(SUM(${convert('si.amount', 'si')}), 0) as total, COUNT(si.id) as count
    FROM sales_invoices si
    JOIN customers cu ON cu.id=si.customer_id
    WHERE si.status != 'cancelled' AND si.issue_date BETWEEN $1 AND $2
    GROUP BY cu.id, cu.company_name ORDER BY total DESC
  `, [from, to]) as any[];

  // ═══════════════════════════════════════════════
  // TAX REPORT — multi-currency VAT
  // ═══════════════════════════════════════════════
  const vatOutput = await safeGet(
    `SELECT COALESCE(SUM(${convert('tax_vat')}), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };
  const vatInput = await safeGet(
    `SELECT COALESCE(SUM(${convert('tax_vat')}), 0) as total FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  // breakdown: standard-rated (tax_vat > 0 → 16%) vs zero-rated (tax_vat = 0)
  const salesBreakdown = await safeGet(
    `SELECT
       COALESCE(SUM(CASE WHEN COALESCE(tax_vat,0) > 0 THEN ${convert('amount')} ELSE 0 END), 0) as standard_rated,
       COALESCE(SUM(CASE WHEN COALESCE(tax_vat,0) = 0 THEN ${convert('amount')} ELSE 0 END), 0) as zero_rated
     FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { standard_rated: number; zero_rated: number };

  const purchasesBreakdown = await safeGet(
    `SELECT
       COALESCE(SUM(CASE WHEN COALESCE(tax_vat,0) > 0 THEN ${convert('amount')} ELSE 0 END), 0) as standard_rated,
       COALESCE(SUM(CASE WHEN COALESCE(tax_vat,0) = 0 THEN ${convert('amount')} ELSE 0 END), 0) as zero_rated
     FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { standard_rated: number; zero_rated: number };

  const taxableSales = grossSalesCur;
  const taxablePurchases = purchasesCur;
  const vatPayable = vatOutput.total - vatInput.total;

  // ═══════════════════════════════════════════════
  // AUDIT TRAIL — from audit_log table (populated by DB triggers)
  // ═══════════════════════════════════════════════
  const auditLogEntries = await safeQuery(`
    SELECT al.entity_type as action, al.entity_id as id, al.action_type,
           al.old_values, al.new_values, al.created_at, u.email as user_email
    FROM audit_log al
    LEFT JOIN users u ON u.id = al.user_id AND u.tenant_id = al.tenant_id
    WHERE al.created_at BETWEEN $1 AND $2
    ORDER BY al.created_at DESC LIMIT 50
  `, [from, to]) as any[];

  // Fallback: if audit_log is empty (triggers not yet active), use UNION approach
  let auditTrail: any[];
  if (auditLogEntries.length > 0) {
    auditTrail = auditLogEntries;
  } else {
    const auditPayments = await safeQuery(
      `SELECT 'Payment' as action, id::TEXT as id, amount, created_at FROM payments WHERE payment_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditExpenses = await safeQuery(
      `SELECT 'Expense' as action, id::TEXT as id, amount, created_at FROM expenses WHERE expense_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditSalaries = await safeQuery(
      `SELECT 'Salary' as action, id::TEXT as id, amount, created_at FROM salaries WHERE pay_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditPurchases = await safeQuery(
      `SELECT 'Purchase Invoice' as action, id::TEXT as id, amount, created_at FROM purchase_invoices WHERE issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditSales = await safeQuery(
      `SELECT 'Sales Invoice' as action, id::TEXT as id, amount, created_at FROM sales_invoices WHERE issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditCreditNotes = await safeQuery(
      `SELECT 'Credit Note' as action, id::TEXT as id, amount, created_at FROM credit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditDebitNotes = await safeQuery(
      `SELECT 'Debit Note' as action, id::TEXT as id, amount, created_at FROM debit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditSupplierPayments = await safeQuery(
      `SELECT 'Supplier Payment' as action, id::TEXT as id, amount, created_at FROM supplier_payments WHERE payment_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditOtherIncome = await safeQuery(
      `SELECT 'Other Income' as action, id::TEXT as id, amount, created_at FROM other_transactions WHERE type='OTHER_INCOME' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditOtherExpenses = await safeQuery(
      `SELECT 'Other Expense' as action, id::TEXT as id, amount, created_at FROM other_transactions WHERE type='OTHER_EXPENSE' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditCapitalInjections = await safeQuery(
      `SELECT 'Capital Injection' as action, id::TEXT as id, amount, created_at FROM capital_transactions WHERE type='CAPITAL_INJECTION' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];
    const auditOwnerWithdrawals = await safeQuery(
      `SELECT 'Owner Withdrawal' as action, id::TEXT as id, amount, created_at FROM capital_transactions WHERE type='OWNER_WITHDRAWAL' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20`,
      [from, to]
    ) as any[];

    auditTrail = [...auditPayments, ...auditExpenses, ...auditSalaries, ...auditPurchases, ...auditSales, ...auditCreditNotes, ...auditDebitNotes, ...auditSupplierPayments, ...auditOtherIncome, ...auditOtherExpenses, ...auditCapitalInjections, ...auditOwnerWithdrawals]
      .sort((a, b) => a.created_at > b.created_at ? -1 : 1)
      .slice(0, 50);
  }

  // ═══════════════════════════════════════════════
  // PD GENERATION FORMULAS (Cash-basis, kept for backward compat)
  // ═══════════════════════════════════════════════
  const pdTotalPayments = allPayments;
  const pdTotalCreditNotes = allCreditNotes;
  const pdTotalPurchaseInvoices = allPurchases;
  const pdTotalDebitNotes = allDebitNotes;
  const pdSupplierPayments = await safeGet(
    `SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments`
  ) as { total: number };
  const pdExpenses = allExpensesTotal;
  const pdSalaries = allSalaries;
  const pdOtherIncome = allOtherIncome;
  const pdOtherExpenses = allOtherExpenses;
  const pdCapitalInjections = allCapitalInjections;
  const pdOwnerWithdrawals = allWithdrawals;

  const pdRevenue = pdTotalPayments.total - pdTotalCreditNotes.total;
  const pdPurchasesTotal = pdTotalPurchaseInvoices.total - pdTotalDebitNotes.total;
  const pdCost = pdPurchasesTotal + pdExpenses.total + pdSalaries.total + pdOtherExpenses.total;
  const pdOtherIncomeTotal = pdOtherIncome.total;
  const pdProfitBeforeTax = pdRevenue - pdCost + pdOtherIncomeTotal;
  const pdIncomeTax = pdProfitBeforeTax > 0 ? pdProfitBeforeTax * (incomeTaxRate / 100) : 0;
  const pdNetProfit = pdProfitBeforeTax - pdIncomeTax;
  const pdCashInflow = pdTotalPayments.total;
  const pdCashOutflow = pdExpenses.total + pdSalaries.total + pdSupplierPayments.total;
  const pdCashOnHandLocal = pdCashInflow - pdCashOutflow + pdCapitalInjections.total - pdOwnerWithdrawals.total;
  const pdTotalAssetsLocal = pdCashOnHandLocal + accountsReceivable.total;
  const pdTotalLiabilitiesLocal = accountsPayable.total;

  return {
    // P&L
    grossSales: grossSales.total,
    salesReturns: salesReturns.total,
    discounts: discounts.total,
    allowances,
    netSales,
    openingInventory,
    purchases: purchases.total,
    directCosts,
    debitNotes: debitNotes.total,
    closingInventory,
    costOfGoodsSold,
    grossProfit,
    adminExpenses,
    sellingDistributionExpenses,
    generalOperatingExpenses,
    salariesTotal: salariesTotal.total,
    depreciationExpense,
    totalOperatingExpenses,
    operatingProfit,
    ebitda,
    grossMarginPercent: netSales > 0 ? (grossProfit / netSales) * 100 : 0,
    netMarginPercent: netSales > 0 ? (netProfit / netSales) * 100 : 0,
    // Comparative period values (prior period)
    grossSalesPrior: grossSalesPri,
    salesReturnsPrior: salesReturnsPri,
    discountsPrior: discountsPri,
    netSalesPrior: netSalesPri,
    purchasesPrior: purchasesPri,
    debitNotesPrior: debitNotesPri,
    costOfGoodsSoldPrior: costOfGoodsSoldPri,
    grossProfitPrior: grossProfitPri,
    grossMarginPercentPrior: netSalesPri > 0 ? (grossProfitPri / netSalesPri) * 100 : 0,
    netMarginPercentPrior: netSalesPri > 0 ? (netProfitPri / netSalesPri) * 100 : 0,
    adminExpensesPrior: adminExpensesPri,
    sellingDistributionExpensesPrior: sellingExpensesPri,
    generalOperatingExpensesPrior: generalExpensesPri,
    salariesTotalPrior: salariesPri,
    depreciationExpensePrior: depreciationPri,
    totalOperatingExpensesPrior: totalOpExPri,
    operatingProfitPrior: opProfitPri,
    ebitdaPrior: ebitdaPri,
    otherIncomePrior: otherIncomePri,
    otherExpensesPrior: otherExpensesPri,
    profitBeforeTaxPrior: pbtPri,
    taxesPrior: taxesPri,
    netProfitPrior: netProfitPri,
    expenseByCategoryPrior: pnlExpenses.map((e: any) => ({ category: e.category, total: e.pri, count: 0 })),
    otherIncome,
    otherExpenses,
    profitBeforeTax,
    taxes,
    netProfit,
    // Legacy computed fields
    totalRevenue: grossSales,
    totalCreditNotes: salesReturns,
    netRevenue: netSales,
    totalPurchases: purchases.total,
    totalDebitNotes: debitNotes.total,
    totalExpenses: expenseTotal,
    totalSalaries: salariesTotal.total,
    operatingExpenses,
    // PD generation (cash-basis)
    pdRevenue,
    pdPurchases: pdPurchasesTotal,
    pdExpenses: pdExpenses.total,
    pdSalaries: pdSalaries.total,
    pdCost,
    pdOtherIncome: pdOtherIncomeTotal,
    pdOtherExpenses: pdOtherExpenses.total,
    pdProfitBeforeTax,
    pdIncomeTax,
    pdNetProfit,
    pdCashInflow,
    pdCashOutflow,
    pdCashOnHand: pdCashOnHandLocal,
    pdCapitalInjections: pdCapitalInjections.total,
    pdOwnerWithdrawals: pdOwnerWithdrawals.total,
    pdTotalAssets: pdTotalAssetsLocal,
    pdTotalLiabilities: pdTotalLiabilitiesLocal,
    expenseByCategory,
    salariesDetail,
    // Balance Sheet
    cashOnHand,
    accountsReceivable: accountsReceivable.total,
    accountsPayable: accountsPayable.total,
    inventoryValue,
    fixedAssetsNet: Number(faRow.total_book_value),
    taxPayable,
    currentAssets,
    nonCurrentAssets,
    totalAssets,
    currentLiabilities,
    nonCurrentLiabilities,
    totalLiabilities,
    totalEquity,
    retainedEarnings,
    balanceCheck,
    // Receivables / Payables
    receivables: { total: unpaidInvoices.total, open: openReceivables, overdue: overdueInvoices.total },
    payables: { total: unpaidBills.total, open: openPayables, overdue: overdueBills.total },
    // Cash Flow (current period)
    cashOperatingInflow: cashOperatingInflowCur,
    cashOperatingOutflow: cashOperatingOutflowCur,
    netOperatingCashFlow: netOperatingCashFlowCur,
    cashSupplierPayments: cfSupplierPayments.cur,
    cashExpensePayments: cfExpenses.cur,
    cashSalaryPayments: cfSalaries.cur,
    investingInflow: investingInflow.total,
    investingOutflow: investingOutflow.total,
    netInvestingCashFlow,
    financingInflow: cfFinancing.inflowCur,
    financingOutflow: cfFinancing.outflowCur,
    netFinancingCashFlow: netFinancingCashFlowCur,
    netCashFlow: netCashFlowCur,
    // Cash Flow prior period
    cashOperatingInflowPrior: cashOperatingInflowPri,
    cashOperatingOutflowPrior: cashOperatingOutflowPri,
    netOperatingCashFlowPrior: netOperatingCashFlowPri,
    cashSupplierPaymentsPrior: cfSupplierPayments.pri,
    cashExpensePaymentsPrior: cfExpenses.pri,
    cashSalaryPaymentsPrior: cfSalaries.pri,
    financingInflowPrior: cfFinancing.inflowPri,
    financingOutflowPrior: cfFinancing.outflowPri,
    netFinancingCashFlowPrior: netFinancingCashFlowPri,
    netCashFlowPrior: netCashFlowPri,
    monthlyCash,
    // Other reports
    trialBalance,
    generalLedger,
    receivablesAging,
    payablesAging,
    salesByCustomer,
    inventoryValuation: { 
      totalItems: totalInventoryItems, 
      totalValue: totalInventoryValue,
      items: inventoryItemsDetail,
      message: totalInventoryItems > 0 ? `${totalInventoryItems} stock item(s) tracked, valued at ${(companySettings as any)?.base_currency || 'KES'} ${totalInventoryValue.toFixed(2)}` : 'No inventory items. Add stock items to track valuation.'
    },
    // Budget vs Actual
    budgetVsActual: await (async () => {
      const budgets = await safeQuery(
        `SELECT category_type, category_name, SUM(amount) as budget_amount 
         FROM budgets WHERE fiscal_year = $1 GROUP BY category_type, category_name ORDER BY category_type, category_name`,
        [year]
      ) as any[];
      const actuals: Record<string, number> = {
        REVENUE: netSales,
        PURCHASES: purchases.total,
        EXPENSES: expenseTotal,
        SALARIES: salariesTotal.total,
        OTHER_INCOME: otherIncome,
        OTHER_EXPENSE: otherExpenses,
      };
      if (budgets.length === 0) {
        return [];
      }
      return budgets.map((b: any) => {
        const actual = actuals[b.category_type as keyof typeof actuals] ?? 0;
        const budgetAmt = Number(b.budget_amount);
        const varianceAmt = actual - budgetAmt;
        return {
          category: b.category_name || b.category_type,
          budget: budgetAmt,
          actual,
          variance: varianceAmt,
          variancePercent: budgetAmt > 0 ? (varianceAmt / budgetAmt) * 100 : 0,
          status: actual <= budgetAmt ? 'favorable' : 'unfavorable',
        };
      });
    })(),
    equityReport: {
      retainedEarnings,
      capitalContributions: totalCapitalInjections,
      withdrawals: totalWithdrawals,
      currentPeriodProfit: netProfit,
      totalEquity,
    },
    taxReport: {
      vatOutput: vatOutput.total,
      vatInput: vatInput.total,
      vatPayable,
      vatPayableBalance,
      incomeTaxPayable,
      taxableSales,
      taxablePurchases,
      standardRatedSales: salesBreakdown.standard_rated,
      zeroRatedSales: salesBreakdown.zero_rated,
      standardRatedPurchases: purchasesBreakdown.standard_rated,
      zeroRatedPurchases: purchasesBreakdown.zero_rated,
      incomeTaxRate,
      profitBeforeTax,
      incomeTax: taxes,
      netProfitAfterTax: netProfit,
      note: `VAT calculated from actual invoice VAT amounts. Income tax rate: ${incomeTaxRate}%. Consult your tax advisor for exact obligations.`,
    },
    auditTrail,
    inventoryItems: inventoryItemsDetail,
    // Fixed Assets summary
    fixedAssets: {
      count: Number(faRow.count),
      totalCost: Number(faRow.total_cost),
      totalDepreciation: Number(faRow.total_depreciation),
      totalBookValue: Number(faRow.total_book_value),
    },
    // Deals pipeline summary
    pipelineSummary: await (async () => {
      const totalPipeline = await safeQuery(`SELECT COALESCE(SUM(deal_value),0) as total FROM deals WHERE status='open'`) as any[];
      const byStage = await safeQuery(`SELECT pipeline_stage, COUNT(*) as count, COALESCE(SUM(deal_value),0) as total FROM deals WHERE status='open' GROUP BY pipeline_stage ORDER BY pipeline_stage`) as any[];
      return { totalPipelineValue: Number(totalPipeline[0]?.total || 0), byStage };
    })(),
    // Projects summary
    projectsSummary: await (async () => {
      const activeProjects = await safeQuery(`SELECT COUNT(*) as count FROM projects WHERE status='active'`) as any[];
      const projectFinances = await safeQuery(`SELECT COALESCE(SUM(budget),0) as total_budget, (SELECT COALESCE(SUM(amount),0) FROM project_transactions WHERE entity_type='revenue') as total_revenue, (SELECT COALESCE(SUM(amount),0) FROM project_transactions WHERE entity_type='expense') as total_expenses FROM projects`) as any[];
      const pf = projectFinances[0] || { total_budget: 0, total_revenue: 0, total_expenses: 0 };
      return { activeCount: Number(activeProjects[0]?.count || 0), totalBudget: Number(pf.total_budget), totalRevenue: Number(pf.total_revenue), totalExpenses: Number(pf.total_expenses) };
    })(),
    // Currency info
    baseCurrency: (companySettings as any)?.base_currency || 'KES',
  };
});
  setCache(cacheKey, reportData);
  return NextResponse.json(reportData);
} catch (err: any) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
  }
  console.error('[reports] Error:', err.message);
  return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
}
}
