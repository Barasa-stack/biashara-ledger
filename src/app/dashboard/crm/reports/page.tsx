'use client';

import { useEffect, useState } from 'react';
import { FileBarChart, TrendingUp, Target, DollarSign, Users } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/currencies';

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function CRMReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/reports').then(r => r.ok ? r.json() : null)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>;

  const won = data?.won || { count: 0, total: 0 };
  const lost = data?.lost || { count: 0, total: 0 };
  const ta = data?.totalActive || {};
  const totalDeals = (won.count || 0) + (lost.count || 0) + (ta.count || 0);
  const winRate = (won.count + lost.count) > 0 ? ((won.count / (won.count + lost.count)) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><FileBarChart className="h-5 w-5 text-brand" /></div>
        <div><h1 className="text-lg font-semibold text-gray-800">CRM Reports</h1><p className="text-xs text-gray-500">Sales analytics and pipeline performance</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs text-gray-500">Win Rate</p>
          <p className="text-2xl font-bold text-green-600">{winRate}%</p>
          <p className="text-xs text-gray-400">{won.count} won · {lost.count} lost</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs text-gray-500">Total Won Value</p>
          <p className="text-2xl font-bold text-green-600">{fmtKES(won.total || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs text-gray-500">Total Lost Value</p>
          <p className="text-2xl font-bold text-red-600">{fmtKES(lost.total || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs text-gray-500">Total Deals</p>
          <p className="text-2xl font-bold text-gray-800">{totalDeals}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Pipeline Performance by Stage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Stage</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Deals</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Total Value</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Avg Value</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PIPELINE_STAGES.map(s => {
                const sd = data?.deals?.find((d: any) => d.pipeline_stage === s.key);
                return (
                  <tr key={s.key}>
                    <td className="py-3 pr-3 font-medium text-gray-800">{s.label}</td>
                    <td className="py-3 pr-3 text-right text-gray-700">{sd?.count || 0}</td>
                    <td className="py-3 pr-3 text-right text-gray-700">{fmtKES(sd?.total || 0)}</td>
                    <td className="py-3 pr-3 text-right text-gray-700">{fmtKES(sd?.avg_value || 0)}</td>
                    <td className="py-3 pr-3 text-right font-medium text-brand">{fmtKES(sd?.weighted || 0)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 font-semibold">
                <td className="py-3 pr-3 text-gray-800">Total</td>
                <td className="py-3 pr-3 text-right text-gray-800">{data?.deals?.reduce((s: number, d: any) => s + (d.count || 0), 0) || 0}</td>
                <td className="py-3 pr-3 text-right text-gray-800">{fmtKES(data?.deals?.reduce((s: number, d: any) => s + (d.total || 0), 0) || 0)}</td>
                <td className="py-3 pr-3 text-right text-gray-800">—</td>
                <td className="py-3 pr-3 text-right text-brand">{fmtKES(data?.deals?.reduce((s: number, d: any) => s + (d.weighted || 0), 0) || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Recent Activities</h3>
        {data?.recentActivities?.length > 0 ? (
          <div className="space-y-2">
            {data.recentActivities.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                <span className="text-xs font-medium capitalize text-gray-500 w-16">{a.type}</span>
                <span className="text-gray-700 flex-1 truncate">{a.subject || a.description}</span>
                {a.customer_name && <span className="text-xs text-gray-400">{a.customer_name}</span>}
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
        )}
      </div>
    </div>
  );
}
