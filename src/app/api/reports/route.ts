import { NextResponse } from 'next/server';
import { query, get, withTenantContext } from '@/lib/db';
import { requireSubscription, AuthError } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { session } = await requireSubscription();
  const { searchParams } = new URL(request.url);
  const year = new Date().getFullYear();
  const from = searchParams.get('from') || `${year}-01-01`;
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

  const reportData = await withTenantContext(session.tenant_id!, async () => {

  // ═══════════════════════════════════════════════
  // PROFIT & LOSS STATEMENT (period-based)
  // ═══════════════════════════════════════════════
  // Revenue — use subtotal (excludes VAT) for true net revenue
  const grossSales = await get(
    `SELECT COALESCE(SUM(subtotal), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const salesReturns = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const discounts = await get(
    `SELECT COALESCE(SUM(discounts), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const allowances = 0;
  const netSales = grossSales.total - salesReturns.total - discounts.total - allowances;

  // Cost of Goods Sold
  const inventoryItems = await query(
    `SELECT COALESCE(SUM(opening_stock * unit_cost), 0) as opening_value, 
            COALESCE(SUM(current_stock * unit_cost), 0) as closing_value
     FROM inventory_items`
  ) as any;
  const openingInventory = inventoryItems[0]?.opening_value ?? 0;
  const closingInventory = inventoryItems[0]?.closing_value ?? 0;

  const purchases = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const debitNotes = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const directCosts = 0;
  const costOfGoodsSold = openingInventory + purchases.total + directCosts - closingInventory - debitNotes.total;

  // Inventory valuation detail
  const inventoryItemsDetail = await query(
    `SELECT id, item_name, sku, category, unit_of_measure, current_stock, unit_cost, (current_stock * unit_cost) as total_value
     FROM inventory_items WHERE current_stock > 0 ORDER BY item_name`
  ) as any[];
  const totalInventoryItems = inventoryItemsDetail.length;
  const totalInventoryValue = inventoryItemsDetail.reduce((s: number, i: any) => s + Number(i.total_value), 0);
  const grossProfit = netSales - costOfGoodsSold;

  // Operating Expenses — dynamic categories
  const allExpenses = await query(
    `SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2 GROUP BY category`,
    [from, to]
  ) as { category: string; total: number }[];

  const expenseMap: Record<string, number> = {};
  // Known category groups for classification; "Other" catches everything unclassified
  const adminKeywords = ['office supplies', 'insurance', 'software', 'subscription', 'professional fees', 'communication', 'utilities', 'services', 'consulting'];
  const sellingKeywords = ['marketing', 'travel', 'transport', 'meals', 'entertainment', 'logistics', 'advertising', 'promotion'];
  const generalKeywords = ['rent', 'maintenance', 'equipment', 'repair', 'cleaning'];

  let adminExpenses = 0;
  let sellingDistributionExpenses = 0;
  let generalOperatingExpenses = 0;

  for (const e of allExpenses) {
    expenseMap[e.category] = e.total;
    const cat = e.category.toLowerCase();
    if (generalKeywords.some(k => cat.includes(k))) {
      generalOperatingExpenses += e.total;
    } else if (sellingKeywords.some(k => cat.includes(k))) {
      sellingDistributionExpenses += e.total;
    } else if (adminKeywords.some(k => cat.includes(k))) {
      adminExpenses += e.total;
    } else {
      // Uncategorized expenses default to admin (operating)
      adminExpenses += e.total;
    }
  }

  const salariesTotal = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const totalOperatingExpenses = adminExpenses + sellingDistributionExpenses + generalOperatingExpenses + salariesTotal.total;
  const operatingProfit = grossProfit - totalOperatingExpenses;

  // Other Income & Expenses
  const otherIncomeRow = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_INCOME' AND transaction_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };
  const otherExpensesRow = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_EXPENSE' AND transaction_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };
  const otherIncome = otherIncomeRow.total;
  const otherExpenses = otherExpensesRow.total;

  // Income Tax
  const companySettings = await get('SELECT vat_rate, income_tax_rate FROM company_settings') as { vat_rate: number; income_tax_rate: number } | undefined;
  const incomeTaxRate = companySettings?.income_tax_rate ?? 0;
  const profitBeforeTax = operatingProfit + otherIncome - otherExpenses;
  const taxes = profitBeforeTax > 0 ? profitBeforeTax * (incomeTaxRate / 100) : 0;
  const netProfit = profitBeforeTax - taxes;

  const expenseTotal = allExpenses.reduce((s, e) => s + e.total, 0);
  const operatingExpenses = expenseTotal + salariesTotal.total;

  // Expense breakdown by category
  const expenseByCategory = await query(
    `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
     FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2 
     GROUP BY category ORDER BY total DESC`,
    [from, to]
  ) as any[];

  // Salaries detail
  const salariesDetail = await get(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
     FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number; count: number };

  // ═══════════════════════════════════════════════
  // BALANCE SHEET (cumulative snapshot)
  // ═══════════════════════════════════════════════
  const allPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  ) as { total: number };

  const allApprovedExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved'"
  ) as { total: number };

  const allPaidSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid'"
  ) as { total: number };

  const allPurchaseTotal = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled'"
  ) as { total: number };

  const allSupplierPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments'
  ) as { total: number };

  const accountsPayable = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAP = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  const cashOnHand = allPayments.total - allApprovedExpenses.total - allPaidSalaries.total - allSupplierPayments.total;

  const accountsReceivable = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAR = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  // All-time P&L for retained earnings — consistent filters throughout
  const allRevenue = await get(
    "SELECT COALESCE(SUM(subtotal), 0) as total FROM sales_invoices WHERE status != 'cancelled'"
  ) as { total: number };
  const allCreditNotes = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes WHERE (status IS NULL OR status != 'cancelled')"
  ) as { total: number };
  const allPurchases = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled'"
  ) as { total: number };
  const allDebitNotes = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes WHERE (status IS NULL OR status != 'cancelled')"
  ) as { total: number };
  const allExpensesTotal = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved'"
  ) as { total: number };
  const allSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid'"
  ) as { total: number };

  // All-time capital transactions
  const allCapitalInjections = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM capital_transactions WHERE type='CAPITAL_INJECTION'"
  ) as { total: number };
  const allWithdrawals = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM capital_transactions WHERE type='OWNER_WITHDRAWAL'"
  ) as { total: number };

  const retainedEarnings = (allRevenue.total - allCreditNotes.total) - allPurchases.total + allDebitNotes.total - allExpensesTotal.total - allSalaries.total;

  // Total assets & liabilities (for balance sheet equation)
  const totalCapitalInjections = allCapitalInjections.total;
  const totalWithdrawals = allWithdrawals.total;
  const currentAssets = Math.max(0, cashOnHand) + accountsReceivable.total;
  const currentLiabilities = accountsPayable.total;
  const totalEquity = retainedEarnings + totalCapitalInjections - totalWithdrawals;

  // ═══════════════════════════════════════════════
  // RECEIVABLES (reuse computed values)
  // ═══════════════════════════════════════════════
  const unpaidInvoices = accountsReceivable;
  const overdueInvoices = overdueAR;
  const openReceivables = unpaidInvoices.total - overdueInvoices.total;

  // ═══════════════════════════════════════════════
  // PAYABLES (reuse computed values)
  // ═══════════════════════════════════════════════
  const unpaidBills = accountsPayable;
  const overdueBills = overdueAP;
  const openPayables = unpaidBills.total - overdueBills.total;

  // ═══════════════════════════════════════════════
  // CASH FLOW (period-based)
  // ═══════════════════════════════════════════════
  // Cash inflows: actual payments received from customers
  const periodPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN $1 AND $2',
    [from, to]
  ) as { total: number };

  // Cash outflows: actual cash disbursed
  const periodExpensePayments = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const periodSalaryPayments = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const periodSupplierPayments = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE payment_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  // Accrual-based purchases (for P&L, not cash flow)
  const periodPurchases = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const cashOperatingInflow = periodPayments.total;
  const cashOperatingOutflow = periodExpensePayments.total + periodSalaryPayments.total + periodSupplierPayments.total;
  const netOperatingCashFlow = cashOperatingInflow - cashOperatingOutflow;

  // Monthly cash flow
  const monthlyCash = [];
  for (let m = 0; m < 12; m++) {
    const dt = new Date(year, m, 1);
    const monthStart = `${year}-${String(m + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, m + 1, 0).toISOString().slice(0, 10);
    const inc = await get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN $1 AND $2',
      [monthStart, monthEnd]
    ) as { total: number };
    const out = await get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM (
        SELECT amount FROM supplier_payments WHERE payment_date BETWEEN $1 AND $2
        UNION ALL SELECT amount FROM expenses WHERE status='approved' AND expense_date BETWEEN $3 AND $4
        UNION ALL SELECT amount FROM salaries WHERE status='paid' AND pay_date BETWEEN $5 AND $6
      ) AS combined`,
      [monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd]
    ) as { total: number };
    monthlyCash.push({
      month: dt.toLocaleString('en-US', { month: 'short' }),
      incoming: inc.total,
      outgoing: out.total,
      profit: inc.total - out.total,
    });
  }

  // ═══════════════════════════════════════════════
  // TRIAL BALANCE (cumulative)
  // ═══════════════════════════════════════════════
  // All-time other income/expenses for trial balance
  const tbOtherIncome = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_INCOME'"
  ) as { total: number };
  const tbOtherExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_EXPENSE'"
  ) as { total: number };

  const tbDebits = allCreditNotes.total + allPurchases.total + allExpensesTotal.total + allSalaries.total + accountsReceivable.total + Math.max(0, cashOnHand) + tbOtherExpenses.total + totalWithdrawals;
  const tbCredits = allRevenue.total + allDebitNotes.total + accountsPayable.total + tbOtherIncome.total + totalCapitalInjections;
  const tbEquity = tbDebits - tbCredits;

  const trialBalance = [
    { account: 'Revenue/Sales', type: 'Credit', balance: allRevenue.total },
    { account: 'Credit Notes (Returns)', type: 'Debit', balance: allCreditNotes.total },
    { account: 'Cost of Sales (Purchases)', type: 'Debit', balance: allPurchases.total },
    { account: 'Debit Notes (Purchase Returns)', type: 'Credit', balance: allDebitNotes.total },
    { account: 'Operating Expenses', type: 'Debit', balance: allExpensesTotal.total },
    { account: 'Salaries & Wages', type: 'Debit', balance: allSalaries.total },
    { account: 'Accounts Receivable', type: 'Debit', balance: accountsReceivable.total },
    { account: 'Accounts Payable', type: 'Credit', balance: accountsPayable.total },
    { account: 'Cash at Bank', type: 'Debit', balance: Math.max(0, cashOnHand) },
    { account: 'Other Income', type: 'Credit', balance: tbOtherIncome.total },
    { account: 'Other Expenses', type: 'Debit', balance: tbOtherExpenses.total },
    { account: 'Capital Contributions', type: 'Credit', balance: totalCapitalInjections },
    { account: 'Owner Withdrawals', type: 'Debit', balance: totalWithdrawals },
    { account: 'Retained Earnings', type: tbEquity >= 0 ? 'Credit' : 'Debit', balance: Math.abs(tbEquity) },
  ];

  // ═══════════════════════════════════════════════
  // GENERAL LEDGER (with all transaction types)
  // ═══════════════════════════════════════════════
  const glPayments = await query(
    "SELECT p.id, 'Payment' as type, p.amount, p.payment_method as detail, p.payment_date as date, p.created_at FROM payments p WHERE p.payment_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glExpenses = await query(
    "SELECT e.id, 'Expense' as type, e.amount, e.category as detail, e.expense_date as date, e.created_at FROM expenses e WHERE e.status='approved' AND e.expense_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glSalaries = await query(
    "SELECT s.id, 'Salary' as type, s.amount, e.name as detail, s.pay_date as date, s.created_at FROM salaries s JOIN employees e ON e.id=s.employee_id WHERE s.status='paid' AND s.pay_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glPurchases = await query(
    "SELECT pi.id, 'Purchase Invoice' as type, pi.amount, c.company_name as detail, pi.issue_date as date, pi.created_at FROM purchase_invoices pi JOIN clients c ON c.id=pi.client_id WHERE pi.issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glSalesInvoices = await query(
    "SELECT si.id, 'Sales Invoice' as type, si.amount, cu.company_name as detail, si.issue_date as date, si.created_at FROM sales_invoices si JOIN customers cu ON cu.id=si.customer_id WHERE si.issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glCreditNotes = await query(
    "SELECT cn.id, 'Credit Note' as type, cn.amount, cn.reason as detail, cn.issue_date as date, cn.created_at FROM credit_notes cn WHERE (cn.status IS NULL OR cn.status != 'cancelled') AND cn.issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glDebitNotes = await query(
    "SELECT dn.id, 'Debit Note' as type, dn.amount, dn.reason as detail, dn.issue_date as date, dn.created_at FROM debit_notes dn WHERE (dn.status IS NULL OR dn.status != 'cancelled') AND dn.issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glSupplierPayments = await query(
    "SELECT sp.id, 'Supplier Payment' as type, sp.amount, c.company_name as detail, sp.payment_date as date, sp.created_at FROM supplier_payments sp JOIN purchase_invoices pi ON pi.id=sp.invoice_id JOIN clients c ON c.id=pi.client_id WHERE sp.payment_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];

  const glOtherTransactions = await query(
    "SELECT id, type as tx_type, amount, category as detail, transaction_date as date, created_at FROM other_transactions WHERE transaction_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glOtherIncome = glOtherTransactions
    .filter((t: any) => t.tx_type === 'OTHER_INCOME')
    .map((t: any) => ({ ...t, type: 'Other Income' }));
  const glOtherExpenses = glOtherTransactions
    .filter((t: any) => t.tx_type === 'OTHER_EXPENSE')
    .map((t: any) => ({ ...t, type: 'Other Expense' }));

  const glCapitalTxns = await query(
    "SELECT id, type as tx_type, amount, description as detail, transaction_date as date, created_at FROM capital_transactions WHERE transaction_date BETWEEN $1 AND $2",
    [from, to]
  ) as any[];
  const glCapitalInjections = glCapitalTxns
    .filter((t: any) => t.tx_type === 'CAPITAL_INJECTION')
    .map((t: any) => ({ ...t, type: 'Capital Injection' }));
  const glOwnerWithdrawals = glCapitalTxns
    .filter((t: any) => t.tx_type === 'OWNER_WITHDRAWAL')
    .map((t: any) => ({ ...t, type: 'Owner Withdrawal' }));

  const generalLedger = [...glPayments, ...glExpenses, ...glSalaries, ...glPurchases, ...glSalesInvoices, ...glCreditNotes, ...glDebitNotes, ...glSupplierPayments, ...glOtherIncome, ...glOtherExpenses, ...glCapitalInjections, ...glOwnerWithdrawals]
    .sort((a, b) => (a.date || a.created_at) > (b.date || b.created_at) ? 1 : -1)
    .slice(0, 100);

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
    const r = await get(
      `SELECT 
        COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total,
        COUNT(*) as count
       FROM sales_invoices WHERE status IN ('unpaid','partially_paid') 
       AND (CURRENT_DATE - NULLIF(due_date,'')::date) BETWEEN $1 AND $2`,
      [b.min, b.max]
     ) as { total: number; count: number };
     return { bucket: b.label, total: r.total, count: r.count };
   }));

   const payablesAging = await Promise.all(agingBuckets.map(async (b) => {
     const r = await get(
       `SELECT 
         COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id), 0)), 0) as total,
         COUNT(*) as count
        FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') 
        AND (CURRENT_DATE - NULLIF(due_date,'')::date) BETWEEN $1 AND $2`,
      [b.min, b.max]
    ) as { total: number; count: number };
    return { bucket: b.label, total: r.total, count: r.count };
  }));

  // ═══════════════════════════════════════════════
  // SALES BY CUSTOMER (accrual-based: invoices, not payments)
  // ═══════════════════════════════════════════════
  const salesByCustomer = await query(`
    SELECT cu.company_name, COALESCE(SUM(si.amount), 0) as total, COUNT(si.id) as count
    FROM sales_invoices si
    JOIN customers cu ON cu.id=si.customer_id
    WHERE si.status != 'cancelled' AND si.issue_date BETWEEN $1 AND $2
    GROUP BY cu.id, cu.company_name ORDER BY total DESC
  `, [from, to]) as any[];

  // ═══════════════════════════════════════════════
  // TAX REPORT
  // ═══════════════════════════════════════════════
  const companyVatRate = (companySettings?.vat_rate ?? 16) / 100;
  // Taxable sales based on invoice issuance (accrual), not cash received
  const taxableSales = grossSales.total;
  const taxablePurchases = periodPurchases.total;
  const vatOutput = taxableSales * companyVatRate;
  const vatInput = taxablePurchases * companyVatRate;
  const vatPayable = vatOutput - vatInput;

  // ═══════════════════════════════════════════════
  // AUDIT TRAIL (with all transaction types)
  // ═══════════════════════════════════════════════
  const auditPayments = await query(
    "SELECT 'Payment' as action, id, amount, created_at FROM payments WHERE payment_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditExpenses = await query(
    "SELECT 'Expense' as action, id, amount, created_at FROM expenses WHERE expense_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditSalaries = await query(
    "SELECT 'Salary' as action, id, amount, created_at FROM salaries WHERE pay_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditPurchases = await query(
    "SELECT 'Purchase Invoice' as action, id, amount, created_at FROM purchase_invoices WHERE issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditSales = await query(
    "SELECT 'Sales Invoice' as action, id, amount, created_at FROM sales_invoices WHERE issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditCreditNotes = await query(
    "SELECT 'Credit Note' as action, id, amount, created_at FROM credit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditDebitNotes = await query(
    "SELECT 'Debit Note' as action, id, amount, created_at FROM debit_notes WHERE (status IS NULL OR status != 'cancelled') AND issue_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];
  const auditSupplierPayments = await query(
    "SELECT 'Supplier Payment' as action, id, amount, created_at FROM supplier_payments WHERE payment_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];

  const auditOtherIncome = await query(
    "SELECT 'Other Income' as action, id, amount, created_at FROM other_transactions WHERE type='OTHER_INCOME' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];

  const auditOtherExpenses = await query(
    "SELECT 'Other Expense' as action, id, amount, created_at FROM other_transactions WHERE type='OTHER_EXPENSE' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];

  const auditCapitalInjections = await query(
    "SELECT 'Capital Injection' as action, id, amount, created_at FROM capital_transactions WHERE type='CAPITAL_INJECTION' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];

  const auditOwnerWithdrawals = await query(
    "SELECT 'Owner Withdrawal' as action, id, amount, created_at FROM capital_transactions WHERE type='OWNER_WITHDRAWAL' AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT 20",
    [from, to]
  ) as any[];

  const auditTrail = [...auditPayments, ...auditExpenses, ...auditSalaries, ...auditPurchases, ...auditSales, ...auditCreditNotes, ...auditDebitNotes, ...auditSupplierPayments, ...auditOtherIncome, ...auditOtherExpenses, ...auditCapitalInjections, ...auditOwnerWithdrawals]
    .sort((a, b) => a.created_at > b.created_at ? -1 : 1)
    .slice(0, 50);

  // ═══════════════════════════════════════════════
  // PD GENERATION FORMULAS (Cash-basis)
  // ═══════════════════════════════════════════════
  const pdTotalPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  ) as { total: number };

  const pdTotalCreditNotes = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes WHERE (status IS NULL OR status != 'cancelled')"
  ) as { total: number };

  const pdTotalPurchaseInvoices = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled'"
  ) as { total: number };

  const pdTotalDebitNotes = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes WHERE (status IS NULL OR status != 'cancelled')"
  ) as { total: number };

  const pdSupplierPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments'
  ) as { total: number };

  const pdExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved'"
  ) as { total: number };

  const pdSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid'"
  ) as { total: number };

  // PD other income/expenses (all-time)
  const pdOtherIncome = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_INCOME'"
  ) as { total: number };
  const pdOtherExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM other_transactions WHERE type='OTHER_EXPENSE'"
  ) as { total: number };
  const pdCapitalInjections = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM capital_transactions WHERE type='CAPITAL_INJECTION'"
  ) as { total: number };
  const pdOwnerWithdrawals = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM capital_transactions WHERE type='OWNER_WITHDRAWAL'"
  ) as { total: number };

  // PD formulas — cash-basis accounting
  const pdRevenue = pdTotalPayments.total - pdTotalCreditNotes.total;
  const pdPurchases = pdTotalPurchaseInvoices.total - pdTotalDebitNotes.total;
  const pdCost = pdPurchases + pdExpenses.total + pdSalaries.total + pdOtherExpenses.total;
  const pdOtherIncomeTotal = pdOtherIncome.total;
  const pdProfitBeforeTax = pdRevenue - pdCost + pdOtherIncomeTotal;
  const pdIncomeTax = pdProfitBeforeTax > 0 ? pdProfitBeforeTax * (incomeTaxRate / 100) : 0;
  const pdNetProfit = pdProfitBeforeTax - pdIncomeTax;
  const pdCashInflow = pdTotalPayments.total;
  const pdCashOutflow = pdExpenses.total + pdSalaries.total + pdSupplierPayments.total;
  const pdCashOnHand = pdCashInflow - pdCashOutflow + pdCapitalInjections.total - pdOwnerWithdrawals.total;
  const pdTotalAssets = pdCashOnHand + accountsReceivable.total;
  const pdTotalLiabilities = accountsPayable.total;

  // ═══════════════════════════════════════════════

  return NextResponse.json({
    // P&L — full accounting formula
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
    totalOperatingExpenses,
    operatingProfit,
    otherIncome,
    otherExpenses,
    profitBeforeTax,
    taxes,
    netProfit,
    // Legacy computed fields
    totalRevenue: grossSales.total,
    totalCreditNotes: salesReturns.total,
    netRevenue: netSales,
    totalPurchases: purchases.total,
    totalDebitNotes: debitNotes.total,
    totalExpenses: expenseTotal,
    totalSalaries: salariesTotal.total,
    operatingExpenses,
    // Preserved PD generation (cash-basis)
    pdRevenue,
    pdPurchases,
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
    pdCashOnHand,
    pdCapitalInjections: pdCapitalInjections.total,
    pdOwnerWithdrawals: pdOwnerWithdrawals.total,
    pdTotalAssets,
    pdTotalLiabilities,
    expenseByCategory,
    salariesDetail,
    // Balance Sheet
    cashOnHand,
    accountsReceivable: accountsReceivable.total,
    accountsPayable: accountsPayable.total,
    currentAssets,
    currentLiabilities,
    totalEquity,
    retainedEarnings,
    // Receivables / Payables
    receivables: { total: unpaidInvoices.total, open: openReceivables, overdue: overdueInvoices.total },
    payables: { total: unpaidBills.total, open: openPayables, overdue: overdueBills.total },
    // Cash Flow
    cashOperatingInflow,
    cashOperatingOutflow,
    netOperatingCashFlow,
    cashSupplierPayments: periodSupplierPayments.total,
    cashExpensePayments: periodExpensePayments.total,
    cashSalaryPayments: periodSalaryPayments.total,
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
      message: totalInventoryItems > 0 ? `${totalInventoryItems} stock item(s) tracked, valued at $${totalInventoryValue.toFixed(2)}` : 'No inventory items. Add stock items to track valuation.'
    },
    // Budget vs Actual
    budgetVsActual: await (async () => {
      const budgets = await query(
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
        // Fallback: placeholder budgets based on actuals +10%
        return [
          { category: 'Revenue', budget: netSales * 1.1, actual: netSales, variance: netSales - netSales * 1.1 },
          { category: 'Purchases', budget: purchases.total * 1.1, actual: purchases.total, variance: purchases.total - purchases.total * 1.1 },
          { category: 'Expenses', budget: expenseTotal * 1.1, actual: expenseTotal, variance: expenseTotal - expenseTotal * 1.1 },
          { category: 'Salaries', budget: salariesTotal.total * 1.1, actual: salariesTotal.total, variance: salariesTotal.total - salariesTotal.total * 1.1 },
        ];
      }
      return budgets.map((b: any) => {
        const actual = actuals[b.category_type as keyof typeof actuals] ?? 0;
        return {
          category: b.category_name || b.category_type,
          budget: Number(b.budget_amount),
          actual,
          variance: actual - Number(b.budget_amount),
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
      vatOutput,
      vatInput,
      vatPayable,
      taxableSales,
      taxablePurchases,
      vatRate: Math.round((companyVatRate ?? 0.16) * 100),
      incomeTaxRate,
      profitBeforeTax,
      incomeTax: taxes,
      netProfitAfterTax: netProfit,
      note: `VAT calculated at ${Math.round((companyVatRate ?? 0.16) * 100)}% configured rate. Income tax rate: ${incomeTaxRate}%. Consult your tax advisor for exact obligations.`,
    },
    auditTrail,
    inventoryItems: inventoryItemsDetail,
    // Fixed Assets summary
    fixedAssets: await (async () => {
      const fa = await query(`SELECT COUNT(*) as count, COALESCE(SUM(purchase_cost),0) as total_cost, COALESCE(SUM(accumulated_depreciation),0) as total_depreciation, COALESCE(SUM(book_value),0) as total_book_value FROM fixed_assets WHERE status='active'`) as any[];
      const faRow = fa[0] || { count: 0, total_cost: 0, total_depreciation: 0, total_book_value: 0 };
      return { count: Number(faRow.count), totalCost: Number(faRow.total_cost), totalDepreciation: Number(faRow.total_depreciation), totalBookValue: Number(faRow.total_book_value) };
    })(),
    // Deals pipeline summary
    pipelineSummary: await (async () => {
      const totalPipeline = await query("SELECT COALESCE(SUM(deal_value),0) as total FROM deals WHERE status='open'") as any[];
      const byStage = await query("SELECT pipeline_stage, COUNT(*) as count, COALESCE(SUM(deal_value),0) as total FROM deals WHERE status='open' GROUP BY pipeline_stage ORDER BY pipeline_stage") as any[];
      return { totalPipelineValue: Number(totalPipeline[0]?.total || 0), byStage };
    })(),
    // Projects summary
    projectsSummary: await (async () => {
      const activeProjects = await query("SELECT COUNT(*) as count FROM projects WHERE status='active'") as any[];
      const projectFinances = await query("SELECT COALESCE(SUM(budget),0) as total_budget, (SELECT COALESCE(SUM(amount),0) FROM project_transactions WHERE entity_type='revenue') as total_revenue, (SELECT COALESCE(SUM(amount),0) FROM project_transactions WHERE entity_type='expense') as total_expenses FROM projects") as any[];
      const pf = projectFinances[0] || { total_budget: 0, total_revenue: 0, total_expenses: 0 };
      return { activeCount: Number(activeProjects[0]?.count || 0), totalBudget: Number(pf.total_budget), totalRevenue: Number(pf.total_revenue), totalExpenses: Number(pf.total_expenses) };
    })(),
    // Currency info
    baseCurrency: (companySettings as any)?.base_currency || 'USD',
  });
});
  return reportData;
} catch (err: any) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
  }
  console.error('[reports] Error:', err.message);
  return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
}
}
