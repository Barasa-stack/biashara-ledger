'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, ComposedChart, CartesianGrid, Legend, Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { MetricBox } from '@/components/dashboard/MetricBox';
import { EmployeeCard } from '@/components/dashboard/EmployeeCard';
import { ReceivablesCard } from '@/components/dashboard/ReceivablesCard';
import { PayablesCard } from '@/components/dashboard/PayablesCard';

type ReportData = {
  totalRevenue: number; totalPurchases: number; totalExpenses: number;
  totalSalaries: number; totalCost: number; netProfit: number; netSales?: number;
  cashOperatingInflow: number; cashOperatingOutflow: number; cashOnHand: number;
  currentAssets: number; currentLiabilities: number;
  receivables: { total: number; open: number; overdue: number };
  payables: { total: number; open: number; overdue: number };
  monthlyCash: { month: string; incoming: number; outgoing: number; profit: number }[];
  baseCurrency: string;
  inventoryValue?: number;
  inventoryItemsCount?: number;
  lowStockItems?: { item_name: string; current_stock: number; reorder_level: number }[];
};

type EmployeeData = { total: number; active: number; monthlyPayroll: number };

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [prevData, setPrevData] = useState<ReportData | null>(null);
  const [employees, setEmployees] = useState<EmployeeData | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-01-01`;
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const currency = data?.baseCurrency || 'KES';

  const fmtWithCurrency = (n: number | string | null | undefined, cur?: string) => {
    const num = Number(n ?? 0);
    const sym = 'KSh';
    return `${sym} ${isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtNum = (n: number | string | null | undefined) => {
    const num = Number(n ?? 0);
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const f = fromDate, t = toDate;
    const prevEnd = new Date(fromDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(fromDate);
    const days = Math.ceil((new Date(t).getTime() - new Date(f).getTime()) / (1000 * 3600 * 24));
    prevStart.setDate(prevStart.getDate() - days);
    const pf = prevStart.toISOString().split('T')[0];
    const pt = prevEnd.toISOString().split('T')[0];

    fetch(`/api/dashboard-summary?from=${f}&to=${t}`, { credentials: 'include' })
      .then(async r => { if (r.ok) return r.json(); const b = await r.json().catch(() => null); throw new Error(b?.error || 'Failed'); })
      .then(setData)
      .catch(e => setError(String(e)));

    fetch(`/api/dashboard-summary?from=${pf}&to=${pt}`, { credentials: 'include' })
      .then(async r => { if (r.ok) return r.json(); })
      .then(setPrevData)
      .catch(() => {});

    fetch('/api/payroll', { credentials: 'include' })
      .then(async r => { if (r.ok) return r.json(); return []; })
      .then((list: any[]) => setEmployees({
        total: list.length,
        active: list.filter((e: any) => e.status === 'active').length,
        monthlyPayroll: list.reduce((s: number, e: any) => s + Number(e.basic_salary || 0), 0),
      }))
      .catch(() => {});
  }, [fromDate, toDate]);

  const computeChange = (current: number, previous: number) => {
    if (!previous) return null;
    return { value: ((current - previous) / Math.abs(previous)) * 100, positive: current >= previous };
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const monthlyCash = Array.isArray(data.monthlyCash) ? data.monthlyCash : [];
  const monthlyData = months.map((m, i) => monthlyCash[i] || { month: m, incoming: 0, outgoing: 0, profit: 0 });

  const revChange = computeChange(data.totalRevenue, prevData?.totalRevenue || 0);
  const netCashFlow = data.cashOperatingInflow - data.cashOperatingOutflow;
  const grossProfitMargin = data.totalRevenue > 0 ? ((data.netSales || data.totalRevenue - data.totalPurchases) / data.totalRevenue) * 100 : 0;
  const operatingMargin = data.totalRevenue > 0 ? ((data.netProfit || 0) / data.totalRevenue) * 100 : 0;
  const expenseRatio = data.totalRevenue > 0 ? ((Number(data.totalExpenses) + Number(data.totalSalaries)) / Number(data.totalRevenue)) * 100 : 0;

  const chartColors = ['var(--color-brand)', 'var(--color-dark)', '#888', '#555'];

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/90 backdrop-blur border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Period</span>
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border border-border bg-white rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
            <span className="text-xs text-gray-500">—</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border border-border bg-white rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
        </div>
        <p className="text-xs text-gray-700">
          <span className="font-medium text-brand">Net Profit:</span>{' '}
          <span className={data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtWithCurrency(data.netProfit)}</span>
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${(() => {
            const diff = Math.abs(data.totalRevenue - (data.totalExpenses + data.totalSalaries) - data.netProfit);
            const tolerance = Math.max(Math.abs(data.totalRevenue) * 0.01, 1);
            return diff <= tolerance ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-700';
          })()}`}>
            {(() => {
              const diff = Math.abs(data.totalRevenue - (data.totalExpenses + data.totalSalaries) - data.netProfit);
              const tolerance = Math.max(Math.abs(data.totalRevenue) * 0.01, 1);
              return diff <= tolerance ? '✓ Revenue/Expenses/Net Profit consistent' : '✗ Revenue − Expenses ≠ Net Profit — check COGS/other income';
            })()}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${data.netProfit >= 0 ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-700'}`}>
            {data.netProfit >= 0 ? '▲ Profitable' : '▼ Loss'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${netCashFlow >= 0 ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-700'}`}>
            {netCashFlow >= 0 ? '● Positive Cash Flow' : '● Negative Cash Flow'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={fmtWithCurrency(data.totalRevenue)}
          color={revChange ? (revChange.positive ? 'green' : 'red') : 'green'} change={revChange}
          onClick={() => router.push('/dashboard/reports?type=profit-loss')} />
        <StatCard icon={DollarSign} label="Total Expenses" value={fmtWithCurrency(data.totalExpenses + data.totalSalaries)}
          color="red" change={computeChange(data.totalExpenses + data.totalSalaries, (prevData?.totalExpenses || 0) + (prevData?.totalSalaries || 0))}
          onClick={() => router.push('/dashboard/reports?type=expenses')} />
        <StatCard icon={TrendingUp} label="Net Profit" value={fmtWithCurrency(data.netProfit)}
          color={data.netProfit >= 0 ? 'green' : 'red'} change={computeChange(data.netProfit, prevData?.netProfit || 0)} />
        <StatCard icon={DollarSign} label="Cash on Hand" value={fmtWithCurrency(data.cashOnHand)}
          color="brand" change={computeChange(data.cashOnHand, prevData?.cashOnHand || 0)}
          onClick={() => router.push('/dashboard/reports?type=cash-flow')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReceivablesCard data={data.receivables} fmt={(n) => fmtWithCurrency(n)} />
        <PayablesCard data={data.payables} fmt={(n) => fmtWithCurrency(n)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Cash Flow — Incoming vs Outgoing</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }}
                formatter={(v: any) => [fmtWithCurrency(v)]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar isAnimationActive={false} dataKey="incoming" fill="var(--color-brand)" radius={[4, 4, 0, 0]} name="Incoming" barSize={18}
                onClick={(e: any) => router.push(`/dashboard/reports?type=cash-flow&from=${fromDate}&to=${toDate}`)} />
              <Bar isAnimationActive={false} dataKey="outgoing" fill="var(--color-dark)" radius={[4, 4, 0, 0]} name="Outgoing" barSize={18} />
              <Line isAnimationActive={false} type="monotone" dataKey="profit" stroke="#555" strokeWidth={2.5} dot={{ r: 3, fill: '#555' }} name="Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg border border-border p-5 flex flex-col justify-center">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Cash Totals</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Incoming</p>
              <p className="text-lg font-bold text-brand">{fmtWithCurrency(data.cashOperatingInflow)}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Outgoing</p>
              <p className="text-lg font-bold text-brand">{fmtWithCurrency(data.cashOperatingOutflow)}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Net Cash Flow</p>
              <p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-brand' : 'text-red-600'}`}>{fmtWithCurrency(netCashFlow)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Revenue/Sales', amount: data.totalRevenue, link: 'profit-loss' },
              { name: 'Purchases', amount: data.totalPurchases, link: 'profit-loss' },
              { name: 'Expenses', amount: data.totalExpenses, link: 'expenses' },
              { name: 'Salaries', amount: data.totalSalaries, link: 'profit-loss' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }} formatter={(v: any) => [fmtWithCurrency(v)]} />
              <Bar isAnimationActive={false} dataKey="amount" radius={[4, 4, 0, 0]} barSize={36}
                onClick={(e: any) => router.push(`/dashboard/reports?type=${e.link || 'profit-loss'}`)}>
                {[0,1,2,3].map(i => <Cell key={i} fill={chartColors[i]} cursor="pointer" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Account Balances</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 w-8">#</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Account</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="py-3 text-sm text-gray-400 w-8">5</td><td className="py-3 text-sm text-gray-800 font-medium">Cash on Hand</td><td className="py-3 text-sm text-right font-medium text-gray-800">{fmtWithCurrency(data.cashOnHand)}</td></tr>
              <tr><td className="py-3 text-sm text-gray-400 w-8">4</td><td className="py-3 text-sm text-red-600 font-medium">Accounts Receivable</td><td className="py-3 text-sm text-right font-medium text-red-600">{fmtWithCurrency(data.receivables.total)}</td></tr>
              <tr><td className="py-3 text-sm text-gray-400 w-8">3</td><td className="py-3 text-sm text-gray-600">Accounts Payable</td><td className="py-3 text-sm text-right font-medium text-gray-600">({fmtWithCurrency(data.payables.total)})</td></tr>
              <tr><td className="py-3 text-sm text-gray-400 w-8">2</td><td className="py-3 text-sm text-green-600 font-medium">Revenue/Sales</td><td className="py-3 text-sm text-right font-medium text-green-600">{fmtWithCurrency(data.totalRevenue)}</td></tr>
              <tr className="border-t border-border font-semibold"><td className="py-3 text-sm text-gray-400 w-8">1</td><td className="py-3 text-sm text-gray-800">Net Equity</td><td className={`py-3 text-sm text-right font-bold ${data.currentAssets - data.currentLiabilities >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{fmtWithCurrency(data.currentAssets - data.currentLiabilities)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Inventory Value</h3>
          <p className="text-2xl font-bold text-brand">{fmtWithCurrency(data.inventoryValue || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">{data.inventoryItemsCount || 0} items tracked</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Low Stock Alerts</h3>
          {data.lowStockItems && data.lowStockItems.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.lowStockItems.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 truncate mr-2">{item.item_name}</span>
                  <span className="text-red-600 font-medium whitespace-nowrap">{item.current_stock} / {item.reorder_level}</span>
                </div>
              ))}
              {data.lowStockItems.length > 5 && (
                <p className="text-xs text-gray-400">+{data.lowStockItems.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No low stock items</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">COGS (Perpetual)</h3>
          <p className="text-2xl font-bold text-gray-800">{fmtWithCurrency(data.totalCost || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Cost of Goods Sold</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Inventory Turn</h3>
          <p className="text-2xl font-bold text-gray-800">
            {data.totalCost && data.inventoryValue ? (data.totalCost / (data.inventoryValue || 1)).toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">x turnover ratio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <EmployeeCard data={employees} fmt={(n) => fmtWithCurrency(n)} />
        <div className="bg-white rounded-lg border border-border p-5 lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Profit Margin Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricBox label="Gross Profit Margin" value={grossProfitMargin.toFixed(1)} suffix="%" valueColor={grossProfitMargin > 50 ? 'green' : grossProfitMargin < 20 ? 'red' : undefined} />
            <MetricBox label="Operating Margin" value={operatingMargin.toFixed(1)} suffix="%" valueColor={operatingMargin > 50 ? 'green' : operatingMargin < 20 ? 'red' : undefined} />
            <MetricBox label="Expense Ratio" value={expenseRatio.toFixed(1)} suffix="%" valueColor={expenseRatio > 30 ? 'red' : expenseRatio < 10 ? 'green' : undefined} />
          </div>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Revenue', amount: data.totalRevenue },
                { name: 'Total Cost', amount: Number(data.totalPurchases) + Number(data.totalExpenses) + Number(data.totalSalaries) },
                { name: 'Net Profit', amount: Math.max(0, data.netProfit) },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#555' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }} formatter={(v: any) => [fmtWithCurrency(v)]} />
                <Bar isAnimationActive={false} dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                  <Cell fill="var(--color-brand)" />
                  <Cell fill="#888" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
