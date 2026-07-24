'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Check, X, Search, Clock, CheckCircle2, XCircle,
  Smartphone, User, Calendar, DollarSign
} from 'lucide-react';

function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-requests');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await fetch(`/api/admin/payment-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchRequests();
    } catch (e) {
      console.error(e);
    }
    setProcessing(null);
  };

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3.5 w-3.5" />,
      approved: <CheckCircle2 className="h-3.5 w-3.5" />,
      rejected: <XCircle className="h-3.5 w-3.5" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Verify and approve client M-Pesa payments</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === tab
                ? 'bg-brand text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No {filter === 'all' ? '' : filter} payment requests</p>
          {filter === 'pending' && (
            <p className="text-xs text-gray-400 mt-1">Clients will appear here after they submit a payment.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Top row */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {req.first_name || req.email}
                    </span>
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-gray-400">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {req.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      KES {Number(req.amount).toLocaleString()} — {req.plan_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                      {req.payment_method}
                    </span>
                  </div>

                  {req.transaction_id && (
                    <p className="text-xs text-gray-400 mt-1.5 font-mono">
                      TX: {req.transaction_id}
                    </p>
                  )}

                  {req.approved_at && (
                    <p className="text-xs text-green-600 mt-1.5">
                      Approved {formatTimeAgo(req.approved_at)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={processing === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-lg transition-colors"
                    >
                      {processing === req.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={processing === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
