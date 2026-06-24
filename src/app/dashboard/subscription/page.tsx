'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

type BillingRecord = {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: string;
};

type SubscriptionStatus = {
  plan: string;
  status: string;
  expiryDate: string;
  daysRemaining: number;
  billingHistory?: BillingRecord[];
};

const fmt = (n: number) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = () => {
    setLoading(true);
    setError('');
    fetch('/api/auth/subscription-status')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load subscription'))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load subscription</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchStatus} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Subscription</h1>
          <p className="text-xs text-gray-500">Manage your plan and billing</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading subscription...</span>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">{data.plan}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                  data.status === 'active' ? 'bg-green-100 text-green-700' :
                  data.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                  data.status === 'expired' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {data.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expiry Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Days Remaining</p>
                <p className={`text-lg font-semibold ${data.daysRemaining > 30 ? 'text-green-600' : data.daysRemaining > 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {data.daysRemaining > 0 ? `${data.daysRemaining} days` : 'Expired'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {data?.billingHistory && data.billingHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Description</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data!.billingHistory!.map((r, i) => (
                  <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{data!.billingHistory!.length - i}</td>
                    <td className="py-3 pr-4 text-gray-800">
                      {new Date(r.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4 text-gray-800">{r.description}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmt(r.amount)}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
