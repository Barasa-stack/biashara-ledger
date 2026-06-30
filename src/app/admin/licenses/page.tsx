'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Key, Copy, Check, Loader2, AlertTriangle, XCircle, CheckCircle2, Clock,
  MoreHorizontal, Ban, Repeat, ExternalLink, RefreshCw, User, Calendar, Download, Filter
} from 'lucide-react';

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/licenses')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setLicenses(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    let list = licenses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.license_key?.toLowerCase().includes(q) ||
        l.company_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') list = list.filter(l => l.is_active);
    if (statusFilter === 'expired') list = list.filter(l => !l.is_active && l.expires_at && new Date(l.expires_at) < new Date());
    if (statusFilter === 'revoked') list = list.filter(l => !l.is_active && !l.is_used);
    return list;
  }, [licenses, search, statusFilter]);

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.is_active).length,
    expired: licenses.filter(l => !l.is_active && l.expires_at && new Date(l.expires_at) < new Date()).length,
    revoked: licenses.filter(l => !l.is_active && !l.is_used).length,
  };

  const handleAction = async (licenseKey: string, action: string) => {
    try {
      await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, action }),
      });
      const res = await fetch('/api/admin/licenses');
      if (res.ok) setLicenses(await res.json());
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Active', value: stats.active, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Expired', value: stats.expired, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Revoked', value: stats.revoked, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search license key, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors">
            <Plus size={16} />
            Generate License
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['License Key', 'Client', 'Plan', 'Status', 'Issue Date', 'Expiry Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No licenses found</td></tr>
              ) : (
                filtered.map((lic: any) => {
                  const isExpired = lic.expires_at && new Date(lic.expires_at) < new Date();
                  const statusColor = lic.is_active ? 'text-brand bg-brand-light' : isExpired ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';
                  const statusLabel = lic.is_active ? 'Active' : isExpired ? 'Expired' : 'Revoked';
                  return (
                    <tr key={lic.id || lic.license_key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Key size={12} className="text-gray-400" />
                          <span className="text-xs font-mono font-medium text-gray-700">{lic.license_key}</span>
                          <button onClick={() => { navigator.clipboard.writeText(lic.license_key); setCopiedKey(lic.id || lic.license_key); setTimeout(() => setCopiedKey(null), 2000); }}
                            className="text-gray-400 hover:text-gray-600">
                            {copiedKey === (lic.id || lic.license_key) ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lic.company_name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{lic.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-gray-600">{lic.plan || 'Standard'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                          {lic.is_active ? <CheckCircle2 size={12} /> : isExpired ? <Clock size={12} /> : <XCircle size={12} />}
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">{lic.created_at ? new Date(lic.created_at).toLocaleDateString() : 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs ${isExpired ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {lic.is_active && (
                            <>
                              <button onClick={() => handleAction(lic.license_key, 'revoke')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                                <Ban size={14} />
                              </button>
                              <button onClick={() => handleAction(lic.license_key, 'extend')}
                                className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand-light rounded-lg transition-colors" title="Extend">
                                <RefreshCw size={14} />
                              </button>
                            </>
                          )}
                          {!lic.is_active && (
                            <button onClick={() => handleAction(lic.license_key, 'reactivate')}
                              className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand-light rounded-lg transition-colors" title="Reactivate">
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
