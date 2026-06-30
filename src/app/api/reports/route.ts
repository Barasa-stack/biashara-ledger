import { NextResponse } from 'next/server';
import { query, get, withTenantContext } from '@/lib/db';
import { requireSubscription } from '@/lib/auth-guard';

export async function GET(request: Request) {
  const { session } = await requireSubscription();
  const { searchParams } = new URL(request.url);
  const year = new Date().getFullYear();
  const from = searchParams.get('from') || `${year}-01-01`;
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

  const reportData = await withTenantContext(session.tenant_id!, async () => {

  // ═══════════════════════════════════════════════
  // PROFIT & LOSS STATEMENT (period-based)
  // ═══════════════════════════════════════════════
  // Revenue
  const grossSales = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const salesReturns = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes WHERE issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const discounts = await get(
    `SELECT COALESCE(SUM(discounts), 0) as total FROM sales_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const allowances = 0;
  const netSales = grossSales.total - salesReturns.total - discounts.total - allowances;

  // Cost of Goods Sold
  const openingInventory = 0;
  const purchases = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const debitNotes = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes WHERE issue_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const directCosts = 0;
  const closingInventory = 0;
  const costOfGoodsSold = openingInventory + purchases.total + directCosts - closingInventory - debitNotes.total;
  const grossProfit = netSales - costOfGoodsSold;

  // Operating Expenses — mapped to match expense form categories
  const adminCategories = ["Office Supplies", "Insurance", "Software & Subscriptions", "Professional Fees", "Communication", "Utilities", "Services", "Consulting", "Other"];
  const sellingDistCategories = ["Marketing", "Travel", "Transport", "Meals & Entertainment", "Logistics"];
  const generalCategories = ["Rent", "Maintenance", "Equipment"];

  const allExpenses = await query(
    `SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2 GROUP BY category`,
    [from, to]
  ) as { category: string; total: number }[];

  const expenseMap: Record<string, number> = {};
  for (const e of allExpenses) expenseMap[e.category] = e.total;

  const adminExpenses = adminCategories.reduce((s, c) => s + (expenseMap[c] || 0), 0);
  const sellingDistributionExpenses = sellingDistCategories.reduce((s, c) => s + (expenseMap[c] || 0), 0);
  const generalOperatingExpenses = generalCategories.reduce((s, c) => s + (expenseMap[c] || 0), 0);

  const salariesTotal = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2`,
    [from, to]
  ) as { total: number };

  const totalOperatingExpenses = adminExpenses + sellingDistributionExpenses + generalOperatingExpenses + salariesTotal.total;
  const operatingProfit = grossProfit - totalOperatingExpenses;

  // Other Income & Expenses
  const otherIncome = 0;
  const otherExpenses = 0;
  const profitBeforeTax = operatingProfit + otherIncome - otherExpenses;
  const taxes = 0;
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

  const accountsPayable = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAP = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE invoice_id=purchase_invoices.id), 0)), 0) as total 
     FROM purchase_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  const cashOnHand = allPayments.total - allApprovedExpenses.total - allPaidSalaries.total - allPurchaseTotal.total + accountsPayable.total;

  const accountsReceivable = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueAR = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  // All-time P&L for retained earnings
  const allRevenue = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM sales_invoices WHERE status != 'cancelled'"
  ) as { total: number };
  const allCreditNotes = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes'
  ) as { total: number };
  const allPurchases = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled'"
  ) as { total: number };
  const allDebitNotes = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes'
  ) as { total: number };
  const allExpensesTotal = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved'"
  ) as { total: number };
  const allSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid'"
  ) as { total: number };

  const retainedEarnings = (allRevenue.total - allCreditNotes.total) - allPurchases.total + allDebitNotes.total - allExpensesTotal.total - allSalaries.total;

  // Total assets & liabilities (for balance sheet equation)
  const currentAssets = Math.max(0, cashOnHand) + accountsReceivable.total;
  const currentLiabilities = accountsPayable.total;
  const totalEquity = retainedEarnings;

  // ═══════════════════════════════════════════════
  // RECEIVABLES
  // ═══════════════════════════════════════════════
  const unpaidInvoices = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid')`
  ) as { total: number };

  const overdueInvoices = await get(
    `SELECT COALESCE(SUM(amount - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=sales_invoices.id), 0)), 0) as total 
     FROM sales_invoices WHERE status IN ('unpaid','partially_paid') AND NULLIF(due_date,'')::date < CURRENT_DATE`
  ) as { total: number };

  const openReceivables = unpaidInvoices.total - overdueInvoices.total;

  // ═══════════════════════════════════════════════
  // PAYABLES
  // ═══════════════════════════════════════════════
  const unpaidBills = accountsPayable;
  const overdueBills = overdueAP;
  const openPayables = unpaidBills.total - overdueBills.total;

  // ═══════════════════════════════════════════════
  // CASH FLOW (period-based)
  // ═══════════════════════════════════════════════
  const periodPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN $1 AND $2',
    [from, to]
  ) as { total: number };

  const periodExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved' AND expense_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const periodSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid' AND pay_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const periodPurchases = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2",
    [from, to]
  ) as { total: number };

  const cashOperatingInflow = periodPayments.total;
  const cashOperatingOutflow = periodExpenses.total + periodSalaries.total + periodPurchases.total;
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
        SELECT amount FROM purchase_invoices WHERE issue_date BETWEEN $1 AND $2
        UNION ALL SELECT amount FROM expenses WHERE status='approved' AND expense_date BETWEEN $3 AND $4
        UNION ALL SELECT amount FROM salaries WHERE status='paid' AND pay_date BETWEEN $5 AND $6
      )`,
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
  const trialBalance = [
    { account: 'Revenue/Sales', type: 'Credit', balance: allRevenue.total },
    { account: 'Credit Notes', type: 'Debit', balance: allCreditNotes.total },
    { account: 'Cost of Sales (Purchases)', type: 'Debit', balance: allPurchases.total },
    { account: 'Debit Notes', type: 'Credit', balance: allDebitNotes.total },
    { account: 'Operating Expenses', type: 'Debit', balance: allExpensesTotal.total },
    { account: 'Salaries & Wages', type: 'Debit', balance: allSalaries.total },
    { account: 'Accounts Receivable', type: 'Debit', balance: accountsReceivable.total },
    { account: 'Accounts Payable', type: 'Credit', balance: accountsPayable.total },
    { account: 'Cash at Bank', type: 'Debit', balance: Math.max(0, cashOnHand) },
  ];

  // ═══════════════════════════════════════════════
  // GENERAL LEDGER
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

  const generalLedger = [...glPayments, ...glExpenses, ...glSalaries, ...glPurchases, ...glSalesInvoices]
    .sort((a, b) => (a.date || a.created_at) > (b.date || b.created_at) ? 1 : -1)
    .slice(0, 100);

  // ═══════════════════════════════════════════════
  // AGING
  // ═══════════════════════════════════════════════
  const agingBuckets = [
    { label: '0–30 days', min: 0, max: 30 },
    { label: '31–60 days', min: 31, max: 60 },
    { label: '61–90 days', min: 61, max: 90 },
    { label: '90+ days', min: 91, max: 999999 },
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
  // SALES BY CUSTOMER
  // ═══════════════════════════════════════════════
  const salesByCustomer = await query(`
    SELECT cu.company_name, COALESCE(SUM(p.amount), 0) as total, COUNT(p.id) as count
    FROM payments p JOIN sales_invoices si ON si.id=p.invoice_id
    JOIN customers cu ON cu.id=si.customer_id
    WHERE p.payment_date BETWEEN $1 AND $2
    GROUP BY cu.id ORDER BY total DESC
  `, [from, to]) as any[];

  // ═══════════════════════════════════════════════
  // TAX REPORT
  // ═══════════════════════════════════════════════
  const taxableSales = periodPayments.total;
  const taxablePurchases = periodPurchases.total;
  const vatOutput = taxableSales * 0.16;
  const vatInput = taxablePurchases * 0.16;
  const vatPayable = vatOutput - vatInput;

  // ═══════════════════════════════════════════════
  // AUDIT TRAIL
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

  const auditTrail = [...auditPayments, ...auditExpenses, ...auditSalaries, ...auditPurchases, ...auditSales]
    .sort((a, b) => a.created_at > b.created_at ? -1 : 1)
    .slice(0, 50);

  // ═══════════════════════════════════════════════
  // RESPONSE
  // ═══════════════════════════════════════════════

  // ═══════════════════════════════════════════════
  // PD GENERATION FORMULAS (Cash-basis — exactly preserved from legacy app)
  // These formulas were perfected over weeks and must remain untouched.
  // They use cash-basis accounting: revenue = actual payments received minus credit notes.
  // ═══════════════════════════════════════════════
  const pdTotalPayments = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  ) as { total: number };

  const pdTotalCreditNotes = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM credit_notes'
  ) as { total: number };

  const pdTotalPurchaseInvoices = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices'
  ) as { total: number };

  const pdTotalDebitNotes = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM debit_notes'
  ) as { total: number };

  const pdExpenses = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status='approved'"
  ) as { total: number };

  const pdSalaries = await get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM salaries WHERE status='paid'"
  ) as { total: number };

  // PD formulas — exact math from source app
  const pdRevenue = pdTotalPayments.total - pdTotalCreditNotes.total;
  const pdPurchases = pdTotalPurchaseInvoices.total - pdTotalDebitNotes.total;
  const pdCost = pdPurchases + pdExpenses.total + pdSalaries.total;
  const pdNetProfit = pdRevenue - pdCost;
  const pdCashInflow = pdTotalPayments.total;
  const pdCashOutflow = pdExpenses.total + pdSalaries.total + pdPurchases;
  const pdCashOnHand = pdCashInflow - pdCashOutflow;
  const pdTotalAssets = pdCashOnHand;
  const pdTotalLiabilities = pdTotalPurchaseInvoices.total - pdTotalPayments.total;

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
    // Preserved PD generation (cash-basis — exact legacy formulas)
    pdRevenue,
    pdPurchases,
    pdExpenses: pdExpenses.total,
    pdSalaries: pdSalaries.total,
    pdCost,
    pdNetProfit,
    pdCashInflow,
    pdCashOutflow,
    pdCashOnHand,
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
    monthlyCash,
    // Other reports
    trialBalance,
    generalLedger,
    receivablesAging,
    payablesAging,
    salesByCustomer,
    inventoryValuation: { totalItems: 0, totalValue: 0, message: 'Inventory module not yet configured. Add stock items to track valuation.' },
    budgetVsActual: [
      { category: 'Revenue', budget: netSales * 1.1, actual: netSales, variance: netSales - netSales * 1.1 },
      { category: 'Purchases', budget: purchases.total * 1.1, actual: purchases.total, variance: purchases.total - purchases.total * 1.1 },
      { category: 'Expenses', budget: expenseTotal * 1.1, actual: expenseTotal, variance: expenseTotal - expenseTotal * 1.1 },
      { category: 'Salaries', budget: salariesTotal.total * 1.1, actual: salariesTotal.total, variance: salariesTotal.total - salariesTotal.total * 1.1 },
    ],
    equityReport: {
      retainedEarnings,
      capitalContributions: 0,
      withdrawals: 0,
      currentPeriodProfit: netProfit,
      totalEquity,
    },
    taxReport: {
      vatOutput,
      vatInput,
      vatPayable,
      taxableSales,
      taxablePurchases,
      note: 'VAT calculated at 16% standard rate. Consult your tax advisor for exact obligations.',
    },
    auditTrail,
  });
});
}
