'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, ComposedChart, CartesianGrid, Legend, Cell,
} from 'recharts';
import { Users, Briefcase, TrendingUp, DollarSign } from 'lucide-react';

type ReportData = {
  totalRevenue: number; totalPurchases: number; totalExpenses: number;
  totalSalaries: number; totalCost: number; netProfit: number; netSales?: number;
  cashOperatingInflow: number; cashOperatingOutflow: number; cashOnHand: number;
  currentAssets: number; currentLiabilities: number;
  receivables: { total: number; open: number; overdue: number };
  payables: { total: number; open: number; overdue: number };
  monthlyCash: { month: string; incoming: number; outgoing: number; profit: number }[];
};

type EmployeeData = {
  total: number;
  active: number;
  monthlyPayroll: number;
};

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [employees, setEmployees] = useState<EmployeeData | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-01-01`;
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports?from=${fromDate}&to=${toDate}`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then(setData)
      .catch(e => setError(String(e)));
    fetch('/api/payroll')
      .then(r => r.ok ? r.json() : [])
      .then((list: any[]) => setEmployees({
        total: list.length,
        active: list.filter((e: any) => e.status === 'active').length,
        monthlyPayroll: list.reduce((s: number, e: any) => s + Number(e.basic_salary || 0), 0),
      }))
      .catch(() => {});
  }, [fromDate, toDate]);

  const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

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

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/90 backdrop-blur border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Period</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-border bg-white rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-xs text-gray-500">—</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-border bg-white rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <p className="text-xs text-gray-700">
          <span className="font-medium text-brand">Net Profit:</span>{' '}
          <span className={data.netProfit >= 0 ? 'text-green-600' : 'text-brand'}>{fmt(data.netProfit)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={fmt(data.totalRevenue)} color="brand" />
        <StatCard icon={DollarSign} label="Total Expenses" value={fmt(data.totalExpenses + data.totalSalaries)} color="gray" />
        <StatCard icon={TrendingUp} label="Net Profit" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? 'green' : 'brand'} />
        <StatCard icon={DollarSign} label="Cash on Hand" value={fmt(data.cashOnHand)} color="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReceivablesCard data={data.receivables} fmt={fmt} />
        <PayablesCard data={data.payables} fmt={fmt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Cash Flow — Incoming vs Outgoing</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }}
                formatter={(v: any) => [fmt(Number(v ?? 0))]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar isAnimationActive={false} dataKey="incoming" fill="var(--color-brand)" radius={[4, 4, 0, 0]} name="Incoming" barSize={18} />
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
              <p className="text-lg font-bold text-brand">{fmt(data.cashOperatingInflow)}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Outgoing</p>
              <p className="text-lg font-bold text-brand">{fmt(data.cashOperatingOutflow)}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Net Cash Flow</p>
              <p className="text-xl font-bold text-brand">
                {fmt(data.cashOperatingInflow - data.cashOperatingOutflow)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Revenue/Sales', amount: data.totalRevenue },
              { name: 'Purchases', amount: data.totalPurchases },
              { name: 'Expenses', amount: data.totalExpenses },
              { name: 'Salaries', amount: data.totalSalaries },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }} formatter={(v: any) => [fmt(Number(v ?? 0))]} />
              <Bar isAnimationActive={false} dataKey="amount" radius={[4, 4, 0, 0]} barSize={36}>
                <Cell fill="var(--color-brand)" />
                <Cell fill="var(--color-dark)" />
                <Cell fill="#888" />
                <Cell fill="#555" />
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
                <tr>
                  <td className="py-3 text-sm text-gray-400 w-8">5</td>
                  <td className="py-3 text-sm text-brand">Cash on Hand</td>
                  <td className="py-3 text-sm text-right font-medium text-brand">{fmt(data.cashOnHand)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-400 w-8">4</td>
                  <td className="py-3 text-sm text-brand">Accounts Receivable</td>
                  <td className="py-3 text-sm text-right font-medium text-brand">{fmt(data.receivables.total)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-400 w-8">3</td>
                  <td className="py-3 text-sm text-brand">Accounts Payable</td>
                  <td className="py-3 text-sm text-right font-medium text-brand">({fmt(data.payables.total)})</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-400 w-8">2</td>
                  <td className="py-3 text-sm text-brand">Revenue/Sales</td>
                  <td className="py-3 text-sm text-right font-medium text-brand">{fmt(data.totalRevenue)}</td>
                </tr>
                <tr className="border-t border-border font-semibold">
                  <td className="py-3 text-sm text-gray-400 w-8">1</td>
                  <td className="py-3 text-sm text-brand">Net Equity</td>
                <td className="py-3 text-sm text-right font-bold text-brand">
                  {fmt(data.currentAssets - data.currentLiabilities)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <EmployeeCard data={employees} fmt={fmt} />
        <div className="bg-white rounded-lg border border-border p-5 lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Profit Margin Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricBox label="Gross Profit Margin" value={data.totalRevenue > 0 ? ((data.netSales || data.totalRevenue - data.totalPurchases) / data.totalRevenue * 100).toFixed(1) : '0.0'} suffix="%" />
            <MetricBox label="Operating Margin" value={data.totalRevenue > 0 ? ((data.netProfit || 0) / data.totalRevenue * 100).toFixed(1) : '0.0'} suffix="%" />
            <MetricBox label="Expense Ratio" value={data.totalRevenue > 0 ? (((data.totalExpenses + data.totalSalaries) || 0) / data.totalRevenue * 100).toFixed(1) : '0.0'} suffix="%" />
          </div>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Revenue', amount: data.totalRevenue },
                { name: 'Total Cost', amount: data.totalPurchases + data.totalExpenses + data.totalSalaries },
                { name: 'Net Profit', amount: Math.max(0, data.netProfit) },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#555' }} tickFormatter={v => `KES ${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff' }} formatter={(v: any) => [fmt(Number(v ?? 0))]} />
                <Bar isAnimationActive={false} dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                  <Cell fill="var(--color-brand)" />
                  <Cell fill="#888" />
                  <Cell fill="#22c55e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'gray' ? 'text-gray-600' : 'text-brand';
  return (
    <div className="bg-white rounded-lg border border-border p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${color === 'green' ? 'bg-green-100' : 'bg-brand/10'} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-base font-bold ${colorClass} truncate`}>{value}</p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-brand">{value}<span className="text-sm font-normal text-gray-500">{suffix}</span></p>
    </div>
  );
}

function EmployeeCard({ data, fmt }: { data: EmployeeData | null; fmt: (n: number) => string }) {
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Employees</h3>
          <p className="text-2xl font-bold text-brand">{data?.total ?? '...'}</p>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Active Employees</span>
          <span className="font-medium text-gray-800">{data?.active ?? '...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payroll This Month</span>
          <span className="font-medium text-gray-800">{data ? fmt(data.monthlyPayroll) : '...'}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div
            className="bg-brand h-full rounded-full transition-all"
            style={{ width: data ? `${(data.active / Math.max(data.total, 1)) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {data ? `${((data.active / Math.max(data.total, 1)) * 100).toFixed(0)}% active` : ''}
        </p>
      </div>
      <a href="/dashboard/payroll" className="mt-4 inline-flex text-xs text-brand font-medium hover:text-gray-800 transition-colors">
        Manage Employees &rarr;
      </a>
    </div>
  );
}

function ReceivablesCard({ data, fmt }: { data?: { total: number; open: number; overdue: number }; fmt: (n: number) => string }) {
  const d = data || { total: 0, open: 0, overdue: 0 };
  const pct = d.total > 0 ? (d.open / d.total) * 100 : 0;
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Receivables</h3>
        <span className="text-xs text-gray-500">Total Outstanding</span>
      </div>
      <p className="text-2xl font-bold text-brand mb-3">{fmt(d.total)}</p>
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Open <span className="font-medium text-brand">{fmt(d.open)}</span></span>
          <span className="text-gray-500">Overdue <span className="font-medium text-brand">{fmt(d.overdue)}</span></span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="bg-brand h-full rounded-l-full transition-all" style={{ width: `${pct}%` }} />
          <div className="bg-gray-400 h-full rounded-r-full transition-all" style={{ width: `${100 - pct}%` }} />
        </div>
      </div>
      <a href="/dashboard/reports?type=receivables-aging" className="text-xs text-brand font-medium hover:text-gray-800 transition-colors">View Report &rarr;</a>
    </div>
  );
}

function PayablesCard({ data, fmt }: { data?: { total: number; open: number; overdue: number }; fmt: (n: number) => string }) {
  const d = data || { total: 0, open: 0, overdue: 0 };
  const pct = d.total > 0 ? (d.overdue / d.total) * 100 : 0;
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Payables</h3>
        <span className="text-xs text-gray-500">Total Outstanding</span>
      </div>
      <p className="text-2xl font-bold text-brand mb-3">{fmt(d.total)}</p>
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Open <span className="font-medium">{fmt(d.open)}</span></span>
          <span className="text-gray-500">Overdue <span className="font-medium text-brand">{fmt(d.overdue)}</span></span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="bg-brand h-full rounded-l-full transition-all" style={{ width: `${pct}%` }} />
          <div className="bg-gray-400 h-full rounded-r-full transition-all" style={{ width: `${100 - pct}%` }} />
        </div>
      </div>
      <a href="/dashboard/reports?type=payables-aging" className="text-xs text-brand font-medium hover:text-gray-800 transition-colors">View Report &rarr;</a>
    </div>
  );
}
