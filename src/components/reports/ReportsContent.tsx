'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Scale, BookOpen, Receipt, Users, Package, BarChart3, ShieldCheck,
  Wallet, PiggyBank, Landmark, LayoutDashboard,
} from 'lucide-react';
import { ApiData, cfmt } from '@/types/reports';
import { fetchReport as fetchReportApi } from '@/lib/api/reports';
import { Section } from '@/components/reports/Section';
import { Row } from '@/components/reports/Row';
import { ReportDownload } from '@/components/reports/ReportDownload';
import { TableDownload } from '@/components/reports/TableDownload';

const reportTabs = [
  { type: 'all', label: 'All Reports', icon: LayoutDashboard },
  { type: 'profit-loss', label: 'Profit & Loss', icon: BarChart3 },
  { type: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
  { type: 'cash-flow', label: 'Cash Flow', icon: Wallet },
  { type: 'trial-balance', label: 'Trial Balance', icon: Scale },
  { type: 'general-ledger', label: 'General Ledger', icon: BookOpen },
  { type: 'receivables-aging', label: 'Receivables Aging', icon: Receipt },
  { type: 'payables-aging', label: 'Payables Aging', icon: Receipt },
  { type: 'expenses', label: 'Expense Report', icon: Receipt },
  { type: 'sales', label: 'Sales Report', icon: Users },
  { type: 'inventory', label: 'Inventory Valuation', icon: Package },
  { type: 'budget-vs-actual', label: 'Budget vs Actual', icon: BarChart3 },
  { type: 'equity', label: "Owner's Equity", icon: PiggyBank },
  { type: 'tax', label: 'Tax Report', icon: Landmark },
  { type: 'audit-trail', label: 'Audit Trail', icon: ShieldCheck },
];

const tabMap: Record<string, string> = {};
for (const t of reportTabs) tabMap[t.type] = t.label;

const now = new Date();
const defaultFrom = `${now.getFullYear()}-01-01`;
const defaultTo = now.toISOString().slice(0, 10);

export function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeType = searchParams.get('type') || 'all';
  const sectionRef = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReport = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchReportApi(f, t);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(from, to);
  }, [fetchReport]);

  const handleRunReport = () => fetchReport(from, to);

  useEffect(() => {
    if (data && activeType !== 'all' && sectionRef.current) {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [data, activeType]);

  const handleTabClick = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'all') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    const qs = params.toString();
    router.push(qs ? `/dashboard/reports?${qs}` : '/dashboard/reports');
    setTimeout(() => fetchReport(from, to), 50);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load reports</p>
          <p className="text-sm text-[#000000]">{error}</p>
          <button onClick={() => fetchReport(from, to)} className="mt-4 px-4 py-2 text-sm text-white bg-brand rounded-lg font-medium hover:opacity-90 transition-opacity">Retry</button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-sm text-[#000000]">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const d = data;

  return (
    <div ref={sectionRef}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand">
          {activeType !== 'all' ? (tabMap[activeType] || 'Report') : 'Financial Reports'}
        </h1>
        <p className="text-sm text-[#000000]">Real-time financial statements — auto-generated from your records</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full sm:w-auto text-sm border border-border rounded-lg px-3 py-1.5 text-[#000000] bg-white" />
        <span className="text-xs text-[#000000] hidden sm:inline">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full sm:w-auto text-sm border border-border rounded-lg px-3 py-1.5 text-[#000000] bg-white" />
        <button onClick={handleRunReport} className="inline-flex items-center gap-1 bg-brand text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-brand-hover transition-colors">
          Run Report
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
        {reportTabs.map(t => (
          <button
            key={t.type}
            onClick={() => handleTabClick(t.type)}
            className={`inline-flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
              (activeType === 'all' && t.type === 'all') || activeType === t.type
                ? 'bg-brand text-white'
                : 'bg-white border border-border text-[#000000] hover:bg-brand hover:text-white hover:border-brand'
            }`}
          >
            <t.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 hidden sm:inline-block" />
            {t.label}
          </button>
        ))}
      </div>

      {loading && data && (
        <div className="flex items-center gap-2 mb-4 text-sm text-brand">
          <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span>Updating...</span>
        </div>
      )}

      {(activeType === 'all' || activeType === 'profit-loss') && (
        <Section icon={BarChart3} title="Profit & Loss Statement" subtitle="Accrual-based revenues, cost of sales, and net profit">
          <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Revenue <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
          <Row label="Gross Sales" value={`${cfmt(d.grossSales)}  |  Prior: ${cfmt(d.grossSalesPrior)}`} color="text-red-700" />
          <Row label="Less: Sales Returns (Credit Notes)" value={`(${cfmt(d.salesReturns)})  |  Prior: (${cfmt(d.salesReturnsPrior)})`} color="text-red-500" />
          <Row label="Less: Discounts" value={`(${cfmt(d.discounts)})  |  Prior: (${cfmt(d.discountsPrior)})`} color="text-red-500" />
          <Row label="Less: Allowances" value={`(${cfmt(d.allowances)})`} color="text-red-500" />
          <div className="border-t border-border my-1" />
          <Row label="Net Sales" value={`${cfmt(d.netSales)}  |  Prior: ${cfmt(d.netSalesPrior)}`} color="text-red-700" fontWeight="font-semibold" />

          <div className="mt-3">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Cost of Goods Sold <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
            <Row label="Opening Inventory" value={cfmt(d.openingInventory)} />
            <Row label="Add: Purchases (Cost of Sales)" value={`${cfmt(d.purchases)}  |  Prior: ${cfmt(d.purchasesPrior)}`} />
            <Row label="Add: Direct Costs" value={cfmt(d.directCosts)} />
            <Row label="Less: Debit Notes" value={`(${cfmt(d.debitNotes)})  |  Prior: (${cfmt(d.debitNotesPrior)})`} color="text-red-600" />
            <Row label="Less: Closing Inventory" value={`(${cfmt(d.closingInventory)})`} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Cost of Goods Sold" value={`${cfmt(d.costOfGoodsSold)}  |  Prior: ${cfmt(d.costOfGoodsSoldPrior)}`} color="text-red-600" fontWeight="font-semibold" />
          </div>

          <div className="border-t border-border my-2" />
          <Row label="Gross Profit" value={`${cfmt(d.grossProfit)}  |  Prior: ${cfmt(d.grossProfitPrior)}`} color={d.grossProfit >= 0 ? 'text-red-700' : 'text-red-700'} fontWeight="font-bold" />
          <Row label="Gross Margin" value={`${d.grossMarginPercent.toFixed(1)}% (Prior: ${d.grossMarginPercentPrior.toFixed(1)}%)`} />

          <div className="mt-3">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Operating Expenses <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
            <Row label="Administrative Expenses" value={`${cfmt(d.adminExpenses)}  |  Prior: ${cfmt(d.adminExpensesPrior)}`} color="text-red-500" />
            <Row label="Selling & Distribution Expenses" value={`${cfmt(d.sellingDistributionExpenses)}  |  Prior: ${cfmt(d.sellingDistributionExpensesPrior)}`} color="text-red-500" />
            <Row label="General Operating Expenses" value={`${cfmt(d.generalOperatingExpenses)}  |  Prior: ${cfmt(d.generalOperatingExpensesPrior)}`} color="text-red-500" />
            <Row label="Salaries & Wages" value={`${cfmt(d.salariesTotal)}  |  Prior: ${cfmt(d.salariesTotalPrior)}`} color="text-red-500" />
            <div className="border-t border-border my-1" />
            <Row label="Total Operating Expenses" value={`${cfmt(d.totalOperatingExpenses)}  |  Prior: ${cfmt(d.totalOperatingExpensesPrior)}`} color="text-red-600" fontWeight="font-semibold" />
          </div>

          <div className="border-t border-border my-2" />
          <Row label="Operating Profit / (Loss)" value={`${cfmt(d.operatingProfit)}  |  Prior: ${cfmt(d.operatingProfitPrior)}`} color={d.operatingProfit >= 0 ? 'text-red-700' : 'text-red-700'} fontWeight="font-bold" />
          <Row label="EBITDA (Operating Profit + Depreciation)" value={`${cfmt(d.ebitda)}  |  Prior: ${cfmt(d.ebitdaPrior)}`} color={d.ebitda >= 0 ? 'text-red-700' : 'text-red-700'} />

          <div className="mt-3">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Other Income &amp; Expenses <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
            <Row label="Other Income" value={`${cfmt(d.otherIncome)}  |  Prior: ${cfmt(d.otherIncomePrior)}`} color="text-red-600" />
            <Row label="Other Expenses" value={`(${cfmt(d.otherExpenses)})  |  Prior: (${cfmt(d.otherExpensesPrior)})`} color="text-red-500" />
          </div>

          <div className="border-t border-border my-2" />
          <Row label="Profit Before Tax" value={`${cfmt(d.profitBeforeTax)}  |  Prior: ${cfmt(d.profitBeforeTaxPrior)}`} color={d.profitBeforeTax >= 0 ? 'text-red-700' : 'text-red-700'} fontWeight="font-bold" />
          <Row label="Less: Tax" value={`(${cfmt(d.taxes)})  |  Prior: (${cfmt(d.taxesPrior)})`} color="text-red-500" />

          <div className="border-t-2 border-double border-brand my-2" />
          <div className="flex justify-between text-sm font-bold pt-1">
            <span className="text-brand text-base">Net Profit / (Loss)</span>
            <span className={`text-base ${d.netProfit >= 0 ? 'text-red-700' : 'text-red-700'}`}>{cfmt(d.netProfit)}</span>
          </div>
          <Row label="Net Margin" value={`${d.netMarginPercent.toFixed(1)}% (Prior: ${d.netMarginPercentPrior.toFixed(1)}%)`} />

          {d.expenseByCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-[#000000] uppercase mb-2">All Expenses by Category</p>
              {d.expenseByCategory.map((e, i) => (
                <Row key={i} label={e.category} value={cfmt(e.total)} />
              ))}
            </div>
          )}
          <ReportDownload title="Profit & Loss Statement" data={[[
            { label: 'Gross Sales', value: cfmt(d.grossSales) },
            { label: 'Less: Sales Returns', value: `(${cfmt(d.salesReturns)})` },
            { label: 'Less: Discounts', value: `(${cfmt(d.discounts)})` },
            { label: 'Less: Allowances', value: `(${cfmt(d.allowances)})` },
            { label: 'Net Sales', value: cfmt(d.netSales) },
            { label: 'Opening Inventory', value: cfmt(d.openingInventory) },
            { label: 'Add: Purchases', value: cfmt(d.purchases) },
            { label: 'Add: Direct Costs', value: cfmt(d.directCosts) },
            { label: 'Less: Debit Notes', value: `(${cfmt(d.debitNotes)})` },
            { label: 'Less: Closing Inventory', value: `(${cfmt(d.closingInventory)})` },
            { label: 'Cost of Goods Sold', value: cfmt(d.costOfGoodsSold) },
            { label: 'Gross Profit', value: cfmt(d.grossProfit) },
            { label: 'Gross Margin', value: `${d.grossMarginPercent.toFixed(1)}%` },
            { label: 'Admin Expenses', value: cfmt(d.adminExpenses) },
            { label: 'Selling & Distribution', value: cfmt(d.sellingDistributionExpenses) },
            { label: 'General Operating Expenses', value: cfmt(d.generalOperatingExpenses) },
            { label: 'Salaries & Wages', value: cfmt(d.salariesTotal) },
            { label: 'Depreciation', value: cfmt(d.depreciationExpense) },
            { label: 'Total Operating Expenses', value: cfmt(d.totalOperatingExpenses) },
            { label: 'Operating Profit / (Loss)', value: cfmt(d.operatingProfit) },
            { label: 'EBITDA', value: cfmt(d.ebitda) },
            { label: 'Other Income', value: cfmt(d.otherIncome) },
            { label: 'Other Expenses', value: `(${cfmt(d.otherExpenses)})` },
            { label: 'Profit Before Tax', value: cfmt(d.profitBeforeTax) },
            { label: 'Less: Tax', value: `(${cfmt(d.taxes)})` },
            { label: 'Net Profit / (Loss)', value: cfmt(d.netProfit) },
            { label: 'Net Margin', value: `${d.netMarginPercent.toFixed(1)}%` },
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'balance-sheet') && (
        <Section icon={Scale} title="Balance Sheet" subtitle="Assets = Liabilities + Equity (cumulative snapshot)">
          <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Assets</p>
          <p className="text-xs text-[#000000] italic mb-2">Current Assets</p>
          <Row label="Cash on Hand" value={cfmt(Math.max(0, d.cashOnHand))} />
          <Row label="Accounts Receivable" value={cfmt(d.accountsReceivable)} />
          <Row label="Inventory" value={cfmt(d.inventoryValue)} />
          <div className="border-t border-border my-1" />
          <Row label="Total Current Assets" value={cfmt(d.currentAssets)} fontWeight="font-bold" />
          {d.nonCurrentAssets > 0 && (
            <>
              <p className="text-xs text-[#000000] italic mb-2 mt-3">Non-Current Assets</p>
              <Row label="Fixed Assets (Cost)" value={cfmt(d.fixedAssets.totalCost)} />
              <Row label="Less: Accumulated Depreciation" value={`(${cfmt(d.fixedAssets.totalDepreciation)})`} color="text-red-600" />
              <Row label="Fixed Assets (Net Book Value)" value={cfmt(d.nonCurrentAssets)} />
              <div className="border-t border-border my-1" />
              <Row label="Total Non-Current Assets" value={cfmt(d.nonCurrentAssets)} fontWeight="font-bold" />
            </>
          )}
          <div className="border-t border-border my-2" />
          <Row label="TOTAL ASSETS" value={cfmt(d.totalAssets)} fontWeight="font-bold" />
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Liabilities</p>
            <p className="text-xs text-[#000000] italic mb-2">Current Liabilities</p>
            <Row label="Accounts Payable" value={cfmt(d.accountsPayable)} color="text-red-600" />
            <Row label="VAT Payable" value={cfmt(d.taxReport.vatPayableBalance)} color="text-red-600" />
            <Row label="Income Tax Payable" value={cfmt(d.taxReport.incomeTaxPayable)} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Total Current Liabilities" value={cfmt(d.currentLiabilities)} color="text-red-700" fontWeight="font-bold" />
            {d.nonCurrentLiabilities > 0 && (
              <>
                <p className="text-xs text-[#000000] italic mb-2 mt-3">Non-Current Liabilities</p>
                <Row label="Total Non-Current Liabilities" value={cfmt(d.nonCurrentLiabilities)} color="text-red-700" fontWeight="font-bold" />
              </>
            )}
            <div className="border-t border-border my-2" />
            <Row label="TOTAL LIABILITIES" value={cfmt(d.totalLiabilities)} color="text-red-700" fontWeight="font-bold" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Equity</p>
            <Row label="Retained Earnings (Cumulative)" value={cfmt(d.retainedEarnings)} />
            <Row label="Capital Contributions" value={cfmt(d.equityReport.capitalContributions)} />
            <Row label="Less: Owner Withdrawals" value={`(${cfmt(d.equityReport.withdrawals)})`} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Total Equity" value={cfmt(d.totalEquity)} fontWeight="font-bold" />
          </div>
          <div className="border-t-2 border-double border-border my-3" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-brand">Total Liabilities &amp; Equity</span>
            <span className="text-brand">{cfmt(d.totalLiabilities + d.totalEquity)}</span>
          </div>
          <div className="bg-surface rounded-lg p-3 mt-3 text-xs text-[#000000]">
            <p className="font-medium">Accounting Equation Check</p>
            <p className="mt-1">Assets ({cfmt(d.totalAssets)}) = Liabilities ({cfmt(d.totalLiabilities)}) + Equity ({cfmt(d.totalEquity)})</p>
            <p className="mt-1">Working Capital: {cfmt(d.currentAssets - d.currentLiabilities)} {(d.currentAssets - d.currentLiabilities) >= 0 ? '(Positive)' : '(Negative)'}</p>
          </div>
          <ReportDownload title="Balance Sheet" data={[[
            { label: 'Cash on Hand', value: cfmt(Math.max(0, d.cashOnHand)) },
            { label: 'Accounts Receivable', value: cfmt(d.accountsReceivable) },
            { label: 'Inventory', value: cfmt(d.inventoryValue) },
            { label: 'Total Current Assets', value: cfmt(d.currentAssets) },
            { label: 'Fixed Assets (Net)', value: cfmt(d.nonCurrentAssets) },
            { label: 'Total Assets', value: cfmt(d.totalAssets) },
            { label: 'Accounts Payable', value: cfmt(d.accountsPayable) },
            { label: 'Total Liabilities', value: cfmt(d.totalLiabilities) },
            { label: 'Retained Earnings', value: cfmt(d.retainedEarnings) },
            { label: 'Capital Contributions', value: cfmt(d.equityReport.capitalContributions) },
            { label: 'Owner Withdrawals', value: `(${cfmt(d.equityReport.withdrawals)})` },
            { label: 'Total Equity', value: cfmt(d.totalEquity) },
            { label: 'Total Liabilities & Equity', value: cfmt(d.totalLiabilities + d.totalEquity) },
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'cash-flow') && (
        <Section icon={Wallet} title="Cash Flow Statement" subtitle="Cash inflows and outflows from operating, investing, and financing activities">
          <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Cash Flow from Operating Activities <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
          <Row label="Cash Received from Customers" value={`${cfmt(d.cashOperatingInflow)}  |  Prior: ${cfmt(d.cashOperatingInflowPrior)}`} />
          <div className="border-t border-border my-1" />
          <Row label="Total Operating Inflows" value={cfmt(d.cashOperatingInflow)} />
          <div className="mt-3">
            <Row label="Cash Paid to Suppliers (Purchases)" value={`(${cfmt(d.cashSupplierPayments)})  |  Prior: (${cfmt(d.cashSupplierPaymentsPrior)})`} color="text-red-600" />
            <Row label="Cash Paid for Expenses" value={`(${cfmt(d.cashExpensePayments)})  |  Prior: (${cfmt(d.cashExpensePaymentsPrior)})`} color="text-red-600" />
            <Row label="Cash Paid for Salaries" value={`(${cfmt(d.cashSalaryPayments)})  |  Prior: (${cfmt(d.cashSalaryPaymentsPrior)})`} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Total Operating Outflows" value={`(${cfmt(d.cashOperatingOutflow)})`} color="text-red-600" />
          </div>
          <div className="border-t-2 border-double border-border my-2" />
          <Row label="Net Cash from Operating Activities" value={`${cfmt(d.netOperatingCashFlow)}  |  Prior: ${cfmt(d.netOperatingCashFlowPrior)}`} fontWeight="font-bold" />
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Cash Flow from Investing Activities</p>
            <Row label="Sale of Fixed Assets" value={cfmt(d.investingInflow)} />
            <Row label="Purchase of Fixed Assets" value={`(${cfmt(d.investingOutflow)})`} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Net Cash from Investing Activities" value={cfmt(d.netInvestingCashFlow)} />
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Cash Flow from Financing Activities <span className="text-gray-400 font-normal">(Current vs Prior Period)</span></p>
            <Row label="Capital Contributions" value={`${cfmt(d.financingInflow)}  |  Prior: ${cfmt(d.financingInflowPrior)}`} />
            <Row label="Owner Withdrawals" value={`(${cfmt(d.financingOutflow)})  |  Prior: (${cfmt(d.financingOutflowPrior)})`} color="text-red-600" />
            <div className="border-t border-border my-1" />
            <Row label="Net Cash from Financing Activities" value={`${cfmt(d.netFinancingCashFlow)}  |  Prior: ${cfmt(d.netFinancingCashFlowPrior)}`} />
          </div>
          <div className="border-t-2 border-double border-brand my-3" />
          <Row label="Net Increase / (Decrease) in Cash" value={`${cfmt(d.netCashFlow)}  |  Prior: ${cfmt(d.netCashFlowPrior)}`} fontWeight="font-bold" />
          <Row label="Net Cash from Operating Activities" value={cfmt(d.netOperatingCashFlow)} />
          <Row label="Net Cash from Investing Activities" value={cfmt(d.netInvestingCashFlow)} />
          <Row label="Net Cash from Financing Activities" value={cfmt(d.netFinancingCashFlow)} />
          <ReportDownload title="Cash Flow Statement" data={[[
            { label: 'Cash Received from Customers', value: cfmt(d.cashOperatingInflow) },
            { label: 'Cash Paid for Purchases', value: `(${cfmt(d.cashSupplierPayments)})` },
            { label: 'Cash Paid for Expenses', value: `(${cfmt(d.cashExpensePayments)})` },
            { label: 'Cash Paid for Salaries', value: `(${cfmt(d.cashSalaryPayments)})` },
            { label: 'Net Cash from Operating Activities', value: cfmt(d.netOperatingCashFlow) },
            { label: 'Sale of Fixed Assets', value: cfmt(d.investingInflow) },
            { label: 'Purchase of Fixed Assets', value: `(${cfmt(d.investingOutflow)})` },
            { label: 'Net Cash from Investing Activities', value: cfmt(d.netInvestingCashFlow) },
            { label: 'Capital Contributions', value: cfmt(d.financingInflow) },
            { label: 'Owner Withdrawals', value: `(${cfmt(d.financingOutflow)})` },
            { label: 'Net Cash from Financing Activities', value: cfmt(d.netFinancingCashFlow) },
            { label: 'Net Increase / (Decrease) in Cash', value: cfmt(d.netCashFlow) },
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'trial-balance') && (
        <Section icon={Scale} title="Trial Balance" subtitle="All ledger balances to check accuracy before final accounts">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Account</th>
                <th className="text-right pb-2 font-medium">Debit</th>
                <th className="text-right pb-2 font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {d.trialBalance.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{d.trialBalance.length - i}</td>
                  <td className="py-2 text-[#000000]">{r.account}</td>
                  <td className="py-2 text-right text-brand">{r.type === 'Debit' ? cfmt(r.balance) : '—'}</td>
                  <td className="py-2 text-right text-red-600">{r.type === 'Credit' ? cfmt(r.balance) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold text-sm">
                <td colSpan={2} className="py-2 text-[#000000]">Totals</td>
                <td className="py-2 text-right text-brand">{cfmt(d.trialBalance.filter(r => r.type === 'Debit').reduce((s, r) => s + r.balance, 0))}</td>
                <td className="py-2 text-right text-red-600">{cfmt(d.trialBalance.filter(r => r.type === 'Credit').reduce((s, r) => s + r.balance, 0))}</td>
              </tr>
            </tfoot>
          </table>
          <TableDownload title="Trial Balance" headers={['#', 'Account', 'Debit', 'Credit']} rows={d.trialBalance.map((r, i) => [String(d.trialBalance.length - i), r.account, r.type === 'Debit' ? cfmt(r.balance) : '—', r.type === 'Credit' ? cfmt(r.balance) : '—'])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'general-ledger') && (
        <Section icon={BookOpen} title="General Ledger" subtitle="Detailed record of all transactions with running balance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Type</th>
                <th className="text-left pb-2 font-medium">Detail</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-right pb-2 font-medium">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {d.generalLedger.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{Math.min(d.generalLedger.length, 50) - i}</td>
                  <td className="py-2 text-[#000000]">{r.date ? new Date(r.date).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand">{r.type}</span></td>
                    <td className="py-2 text-[#000000]">{r.detail || '—'}</td>
                    <td className="py-2 text-right font-medium text-brand">{cfmt(r.amount)}</td>
                    <td className="py-2 text-right font-medium text-[#000000]">{cfmt(r.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#000000] mt-3">Showing up to 50 entries sorted by date.</p>
          <TableDownload title="General Ledger" headers={['#', 'Date', 'Type', 'Detail', 'Amount', 'Running Balance']} rows={d.generalLedger.slice(0, 50).map((r, i) => [String(Math.min(d.generalLedger.length, 50) - i),
            r.date ? new Date(r.date).toLocaleDateString('en-US') : '—',
            r.type,
            r.detail || '—',
            cfmt(r.amount),
            cfmt(r.runningBalance),
          ])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'receivables-aging') && (
        <Section icon={Receipt} title="Accounts Receivable Aging" subtitle="Unpaid customer invoices by due date">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Bucket</th>
                <th className="text-right pb-2 font-medium">Count</th>
                <th className="text-right pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.receivablesAging.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{d.receivablesAging.length - i}</td>
                  <td className="py-2 text-[#000000]">{r.bucket}</td>
                  <td className="py-2 text-right text-[#000000]">{r.count}</td>
                  <td className="py-2 text-right font-medium text-brand">{cfmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableDownload title="Receivables Aging" headers={['#', 'Bucket', 'Count', 'Total']} rows={d.receivablesAging.map((r, i) => [String(d.receivablesAging.length - i), r.bucket, String(r.count), cfmt(r.total)])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'payables-aging') && (
        <Section icon={Receipt} title="Accounts Payable Aging" subtitle="Outstanding supplier bills and payment timelines">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Bucket</th>
                <th className="text-right pb-2 font-medium">Count</th>
                <th className="text-right pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.payablesAging.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{d.payablesAging.length - i}</td>
                  <td className="py-2 text-[#000000]">{r.bucket}</td>
                  <td className="py-2 text-right text-[#000000]">{r.count}</td>
                  <td className="py-2 text-right font-medium text-red-600">{cfmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableDownload title="Payables Aging" headers={['#', 'Bucket', 'Count', 'Total']} rows={d.payablesAging.map((r, i) => [String(d.payablesAging.length - i), r.bucket, String(r.count), cfmt(r.total)])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'expenses') && (
        <Section icon={Receipt} title="Expense Report" subtitle="Categorized summary of company expenses">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Category</th>
                <th className="text-right pb-2 font-medium">Count</th>
                <th className="text-right pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.expenseByCategory.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{d.expenseByCategory.length - i}</td>
                  <td className="py-2 text-[#000000] capitalize">{r.category}</td>
                  <td className="py-2 text-right text-[#000000]">{r.count}</td>
                  <td className="py-2 text-right font-medium text-brand">{cfmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableDownload title="Expense Report" headers={['#', 'Category', 'Count', 'Total']} rows={d.expenseByCategory.map((r, i) => [String(d.expenseByCategory.length - i), r.category, String(r.count), cfmt(r.total)])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'sales') && (
        <Section icon={Users} title="Sales Report" subtitle="Revenue by customer">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Customer</th>
                <th className="text-right pb-2 font-medium">Transactions</th>
                <th className="text-right pb-2 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {d.salesByCustomer.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{d.salesByCustomer.length - i}</td>
                  <td className="py-2 text-[#000000]">{r.company_name}</td>
                  <td className="py-2 text-right text-[#000000]">{r.count}</td>
                  <td className="py-2 text-right font-medium text-red-600">{cfmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableDownload title="Sales Report" headers={['#', 'Customer', 'Transactions', 'Total Revenue']} rows={d.salesByCustomer.map((r, i) => [String(d.salesByCustomer.length - i), r.company_name, String(r.count), cfmt(r.total)])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'inventory') && (
        <Section icon={Package} title="Inventory Valuation Report" subtitle="Stock levels and value (cost method: weighted average)">
          {d.inventoryValuation.totalItems === 0 ? (
            <div className="bg-surface rounded-lg p-4 text-sm text-[#000000]">
              <p>{d.inventoryValuation.message}</p>
            </div>
          ) : (
            <>
              <Row label="Total Items in Stock" value={String(d.inventoryValuation.totalItems)} />
              <Row label="Total Inventory Value" value={cfmt(d.inventoryValuation.totalValue)} />
              {d.inventoryValuation.items && d.inventoryValuation.items.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Stock Items Detail</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[#000000] text-xs uppercase">
                        <th className="text-left pb-2 font-medium">Item</th>
                        <th className="text-left pb-2 font-medium">SKU</th>
                        <th className="text-left pb-2 font-medium">Category</th>
                        <th className="text-right pb-2 font-medium">Qty</th>
                        <th className="text-right pb-2 font-medium">Unit Cost</th>
                        <th className="text-right pb-2 font-medium">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.inventoryValuation.items.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5 text-[#000000]">{item.item_name}</td>
                          <td className="py-1.5 text-[#000000]">{item.sku || '—'}</td>
                          <td className="py-1.5 text-[#000000]">{item.category || '—'}</td>
                          <td className="py-1.5 text-right text-[#000000]">{item.current_stock}</td>
                          <td className="py-1.5 text-right text-[#000000]">{cfmt(item.unit_cost)}</td>
                          <td className="py-1.5 text-right font-medium text-brand">{cfmt(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          <ReportDownload title="Inventory Valuation" data={[[
            { label: 'Total Items in Stock', value: String(d.inventoryValuation.totalItems) },
            { label: 'Total Inventory Value', value: cfmt(d.inventoryValuation.totalValue) },
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'budget-vs-actual') && (
        <Section icon={BarChart3} title="Budget vs Actual Report" subtitle="Comparing planned budgets with actual performance">
          {d.budgetVsActual.length === 0 ? (
            <div className="bg-surface rounded-lg p-4 text-sm text-[#000000]">
              <p>No budgets have been set up yet. Go to <strong>Budgets</strong> in the sidebar to create budgets for meaningful variance tracking.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[#000000] text-xs uppercase">
                  <th className="text-left pb-2 font-medium w-8">#</th>
                  <th className="text-left pb-2 font-medium">Category</th>
                  <th className="text-right pb-2 font-medium">Budget</th>
                  <th className="text-right pb-2 font-medium">Actual</th>
                  <th className="text-right pb-2 font-medium">Variance</th>
                  <th className="text-right pb-2 font-medium">Var %</th>
                  <th className="text-center pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.budgetVsActual.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-gray-400 w-8">{d.budgetVsActual.length - i}</td>
                    <td className="py-2 text-[#000000]">{r.category}</td>
                    <td className="py-2 text-right text-[#000000]">{cfmt(r.budget)}</td>
                    <td className="py-2 text-right font-medium text-brand">{cfmt(r.actual)}</td>
                    <td className={`py-2 text-right font-medium ${r.variance >= 0 ? (r.status === 'favorable' ? 'text-green-600' : 'text-red-600') : (r.status === 'favorable' ? 'text-green-600' : 'text-red-600')}`}>{r.variance >= 0 ? cfmt(r.variance) : `(${cfmt(Math.abs(r.variance))})`}</td>
                    <td className={`py-2 text-right font-medium ${r.status === 'favorable' ? 'text-green-600' : 'text-red-600'}`}>{r.variancePercent >= 0 ? '+' : ''}{r.variancePercent.toFixed(1)}%</td>
                    <td className={`py-2 text-center font-medium ${r.status === 'favorable' ? 'text-green-600' : 'text-red-600'}`}>{r.status === 'favorable' ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <TableDownload title="Budget vs Actual" headers={['#', 'Category', 'Budget', 'Actual', 'Variance', 'Var %', 'Status']} rows={d.budgetVsActual.map((r, i) => [String(d.budgetVsActual.length - i), r.category, cfmt(r.budget), cfmt(r.actual), r.variance >= 0 ? cfmt(r.variance) : `(${cfmt(Math.abs(r.variance))})`, `${(r.variancePercent >= 0 ? '+' : '')}${r.variancePercent.toFixed(1)}%`, r.status])} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'equity') && (
        <Section icon={PiggyBank} title="Statement of Changes in Equity" subtitle="Opening equity, movements, and closing balance">
          <Row label="Retained Earnings (Opening)" value={cfmt(d.equityReport.retainedEarnings - d.equityReport.currentPeriodProfit)} />
          <Row label="Add: Current Period Profit" value={cfmt(d.equityReport.currentPeriodProfit)} color="text-green-600" />
          <Row label="Add: Capital Contributions" value={cfmt(d.equityReport.capitalContributions)} />
          <Row label="Less: Owner Withdrawals" value={`(${cfmt(d.equityReport.withdrawals)})`} color="text-red-600" />
          <div className="border-t border-border my-2" />
          <Row label="Total Equity (Closing)" value={cfmt(d.equityReport.totalEquity)} fontWeight="font-bold" />
          <ReportDownload title="Owner's Equity Report" data={[[
            { label: 'Retained Earnings (Opening)', value: cfmt(d.equityReport.retainedEarnings - d.equityReport.currentPeriodProfit) },
            { label: 'Current Period Profit', value: cfmt(d.equityReport.currentPeriodProfit) },
            { label: 'Capital Contributions', value: cfmt(d.equityReport.capitalContributions) },
            { label: 'Owner Withdrawals', value: `(${cfmt(d.equityReport.withdrawals)})` },
            { label: 'Total Equity (Closing)', value: cfmt(d.equityReport.totalEquity) },
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'tax') && (
        <Section icon={Landmark} title="Tax Report" subtitle="VAT, income tax, and statutory obligations">
          <p className="text-xs font-semibold text-[#000000] uppercase mb-2">VAT Summary</p>
          <Row label="Total Sales (incl. VAT)" value={cfmt(d.taxReport.taxableSales)} />
          {d.taxReport.zeroRatedSales > 0 && (
            <Row label="Zero-Rated Sales (0% VAT)" value={cfmt(d.taxReport.zeroRatedSales)} />
          )}
          {d.taxReport.standardRatedSales > 0 && (
            <Row label="Standard-Rated Sales (16% VAT)" value={cfmt(d.taxReport.standardRatedSales)} />
          )}
          <Row label="Output VAT Collected (16% on standard-rated)" value={cfmt(d.taxReport.vatOutput)} color="text-brand" />
          <Row label="Total Purchases (incl. VAT)" value={cfmt(d.taxReport.taxablePurchases)} />
          {d.taxReport.zeroRatedPurchases > 0 && (
            <Row label="Zero-Rated Purchases (0% VAT)" value={cfmt(d.taxReport.zeroRatedPurchases)} />
          )}
          {d.taxReport.standardRatedPurchases > 0 && (
            <Row label="Standard-Rated Purchases (16% VAT)" value={cfmt(d.taxReport.standardRatedPurchases)} />
          )}
          <Row label="Input VAT Reclaimable (16% on standard-rated)" value={cfmt(d.taxReport.vatInput)} color="text-red-600" />
          <div className="border-t border-border my-2" />
          <Row label="VAT Payable / (Refundable)" value={cfmt(Math.abs(d.taxReport.vatPayable))} color={d.taxReport.vatPayable >= 0 ? 'text-brand' : 'text-red-600'} />

          {d.taxReport.incomeTaxRate > 0 && (
            <>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-[#000000] uppercase mb-2">Income Tax</p>
                <Row label="Profit Before Tax" value={cfmt(d.taxReport.profitBeforeTax)} />
                <Row label={`Income Tax Rate`} value={`${d.taxReport.incomeTaxRate}%`} />
                <Row label="Income Tax Provision" value={`(${cfmt(d.taxReport.incomeTax)})`} color="text-red-500" />
                <div className="border-t border-border my-2" />
                <Row label="Net Profit After Tax" value={cfmt(d.taxReport.netProfitAfterTax)} color={d.taxReport.netProfitAfterTax >= 0 ? 'text-red-700' : 'text-red-700'} fontWeight="font-bold" />
              </div>
            </>
          )}

          <div className="bg-surface rounded-lg p-3 mt-3 text-xs text-[#000000]">
            <p className="font-medium">Note</p>
            <p className="mt-1">{d.taxReport.note}</p>
          </div>
          <ReportDownload title="Tax Report" data={[[
            { label: 'Total Sales (incl. VAT)', value: cfmt(d.taxReport.taxableSales) },
            ...(d.taxReport.zeroRatedSales > 0 ? [{ label: 'Zero-Rated Sales (0%)', value: cfmt(d.taxReport.zeroRatedSales) }] : []),
            ...(d.taxReport.standardRatedSales > 0 ? [{ label: 'Standard-Rated Sales (16%)', value: cfmt(d.taxReport.standardRatedSales) }] : []),
            { label: 'Output VAT Collected', value: cfmt(d.taxReport.vatOutput) },
            { label: 'Total Purchases (incl. VAT)', value: cfmt(d.taxReport.taxablePurchases) },
            ...(d.taxReport.zeroRatedPurchases > 0 ? [{ label: 'Zero-Rated Purchases (0%)', value: cfmt(d.taxReport.zeroRatedPurchases) }] : []),
            ...(d.taxReport.standardRatedPurchases > 0 ? [{ label: 'Standard-Rated Purchases (16%)', value: cfmt(d.taxReport.standardRatedPurchases) }] : []),
            { label: 'Input VAT Reclaimable', value: cfmt(d.taxReport.vatInput) },
            { label: 'VAT Payable / (Refundable)', value: cfmt(Math.abs(d.taxReport.vatPayable)) },
            ...(d.taxReport.incomeTaxRate > 0 ? [
              { label: 'Profit Before Tax', value: cfmt(d.taxReport.profitBeforeTax) },
              { label: `Income Tax (${d.taxReport.incomeTaxRate}%)`, value: `(${cfmt(d.taxReport.incomeTax)})` },
              { label: 'Net Profit After Tax', value: cfmt(d.taxReport.netProfitAfterTax) },
            ] : []),
          ]]} />
        </Section>
      )}

      {(activeType === 'all' || activeType === 'audit-trail') && (
        <Section icon={ShieldCheck} title="Audit Trail Report" subtitle="Transaction log — user identity tracking requires schema migration">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-border text-[#000000] text-xs uppercase">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Action</th>
                <th className="text-left pb-2 font-medium">Reference</th>
                <th className="text-right pb-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {d.auditTrail.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-gray-400 w-8">{Math.min(d.auditTrail.length, 50) - i}</td>
                  <td className="py-2 text-[#000000]">{new Date(r.created_at).toLocaleString('en-US')}</td>
                    <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand">{r.action}</span></td>
                    <td className="py-2 text-[#000000] text-xs">#{r.id?.slice(0, 8) || '—'}</td>
                    <td className="py-2 text-right font-medium text-brand">{cfmt(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-surface rounded-lg p-3 mt-3 text-xs text-[#000000]">
            <p className="font-medium">Note</p>
            <p className="mt-1">This audit trail is reconstructed from transaction tables. For full user-level auditing (who did what, IP address, before/after values), the <code>audit_log</code> table needs to be populated via triggers or application hooks. This will be implemented in a future update.</p>
          </div>
          <TableDownload title="Audit Trail" headers={['Date', 'Action', 'Reference', 'Amount']} rows={d.auditTrail.slice(0, 50).map(r => [
            new Date(r.created_at).toLocaleString('en-US'),
            r.action,
            r.id?.slice(0, 8) || '—',
            cfmt(r.amount),
          ])} />
        </Section>
      )}

      {activeType === 'all' && (
        <div className="bg-white border border-border rounded-xl p-4 text-sm text-brand mt-6">
          <p className="font-medium">Real-Time Reporting</p>
          <p className="mt-1">All financial statements update automatically as you add transactions. No manual recalculation needed.</p>
        </div>
      )}
    </div>
  );
}
