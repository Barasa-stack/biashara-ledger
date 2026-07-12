'use client';

import { Users } from 'lucide-react';

type Data = { total: number; active: number; monthlyPayroll: number } | null;

export function EmployeeCard({ data, fmt }: { data: Data; fmt: (n: number) => string }) {
  const noActivity = !data || data.active === 0 || data.total === 0;
  const noPayroll = data && data.total > 0 && data.monthlyPayroll === 0;
  const isRisk = noActivity || noPayroll;
  return (
    <div className={`bg-white rounded-lg border ${isRisk ? 'border-red-300' : 'border-border'} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${isRisk ? 'bg-red-100' : 'bg-brand/10'} flex items-center justify-center`}>
          <Users className={`h-5 w-5 ${isRisk ? 'text-red-600' : 'text-brand'}`} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Employees</h3>
          <p className={`text-2xl font-bold ${isRisk ? 'text-red-600' : 'text-brand'}`}>{data?.total ?? '...'}</p>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Active Employees</span>
          <span className={`font-medium ${isRisk ? 'text-red-600' : 'text-gray-800'}`}>{data?.active ?? '...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payroll This Month</span>
          <span className={`font-medium ${isRisk ? 'text-red-600' : 'text-gray-800'}`}>{data ? fmt(data.monthlyPayroll) : '...'}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div className={`${isRisk ? 'bg-red-500' : 'bg-brand'} h-full rounded-full transition-all`} style={{ width: data ? `${(data.active / Math.max(data.total, 1)) * 100}%` : '0%' }} />
        </div>
        <p className={`text-xs ${isRisk ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          {noActivity ? 'No active employees — review payroll setup' : noPayroll ? 'Employees exist but payroll is zero — check setup' : data ? `${((data.active / Math.max(data.total, 1)) * 100).toFixed(0)}% active` : ''}
        </p>
      </div>
      <a href="/dashboard/payroll" className="mt-4 inline-flex text-xs text-brand font-medium hover:text-gray-800 transition-colors">Manage Employees &rarr;</a>
    </div>
  );
}
