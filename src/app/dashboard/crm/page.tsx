'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, DollarSign, Activity } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/currencies';

const STAGE_COLORS: Record<string, string> = {
  lead: '#6b7280',
  qualified: '#2563eb',
  proposal: '#9333ea',
  negotiation: '#ea580c',
  closed_won: '#16a34a',
  closed_lost: '#dc2626',
};
import Link from 'next/link';

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function CRMDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/reports')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-sm text-gray-600">Loading CRM dashboard...</span>
      </div>
    </div>
  );

  const totalActive = data?.totalActive || {};
  const won = data?.won || { count: 0, total: 0 };
  const lost = data?.lost || { count: 0, total: 0 };
  const totalDeals = (won.count || 0) + (lost.count || 0) + (totalActive.count || 0);
  const winRate = totalDeals > 0 ? ((won.count / (won.count + lost.count)) * 100).toFixed(1) : '0.0';
  const stageData = data?.deals || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">CRM Analytics Board</h1>
          <p className="text-xs text-gray-500">Sales performance and pipeline overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-brand" /></div>
            <p className="text-xs text-gray-500">Pipeline Value</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{fmtKES(totalActive.total || 0)}</p>
          <p className="text-xs text-gray-400">Weighted: {fmtKES(totalActive.weighted || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Target className="h-4 w-4 text-blue-600" /></div>
            <p className="text-xs text-gray-500">Active Deals</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{totalActive.count || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-green-600" /></div>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{winRate}%</p>
          <p className="text-xs text-gray-400">{won.count} won / {lost.count} lost</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="h-4 w-4 text-purple-600" /></div>
            <p className="text-xs text-gray-500">Total Deals</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{totalDeals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {PIPELINE_STAGES.filter(s => s.key !== 'closed_lost').map(stage => {
              const sd = stageData.find((d: any) => d.pipeline_stage === stage.key);
              const value = sd?.total || 0;
              const count = sd?.count || 0;
              const pct = totalActive.total > 0 ? (value / totalActive.total) * 100 : 0;
              return (
                <div key={stage.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{stage.label}</span>
                    <span className="text-gray-500">{fmtKES(value)} ({count})</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: STAGE_COLORS[stage.key] || '#df1c1c' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">Recent Activity</h3>
          {data?.recentActivities?.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.recentActivities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    a.type === 'call' ? 'bg-green-100' :
                    a.type === 'email' ? 'bg-blue-100' :
                    a.type === 'meeting' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Activity className={`h-3 w-3 ${
                      a.type === 'call' ? 'text-green-600' :
                      a.type === 'email' ? 'text-blue-600' :
                      a.type === 'meeting' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 font-medium capitalize">{a.type}</p>
                    <p className="text-gray-500 text-xs truncate">{a.subject || a.description}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {a.customer_name && <>{a.customer_name} · </>}
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Activity className="h-6 w-6 mb-2" />
              <p className="text-xs">No recent activity</p>
            </div>
          )}
          <Link href="/dashboard/crm/activities" className="mt-3 inline-flex text-xs text-brand font-medium hover:text-gray-800 transition-colors">View All Activity &rarr;</Link>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard/crm/pipeline" className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">View Pipeline</Link>
        <Link href="/dashboard/crm/reports" className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-surface transition-colors">Full Reports</Link>
      </div>
    </div>
  );
}
