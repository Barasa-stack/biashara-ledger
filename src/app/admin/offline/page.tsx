'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Monitor, Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, XCircle,
  Loader2, RefreshCw, Copy, Check, ExternalLink
} from 'lucide-react';

export default function OfflinePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'expiring'>('all');

  useEffect(() => {
    fetch('/api/admin/offline-clients')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setSessions(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    let list = sessions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.company_name?.toLowerCase().includes(q) ||
        s.session_token?.toLowerCase().includes(q) ||
        s.client_email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'online') list = list.filter(s => s.online_status === 'online' || s.online_status === 'connected');
    if (statusFilter === 'offline') list = list.filter(s => s.online_status === 'offline');
    if (statusFilter === 'expiring') list = list.filter(s => s.session_status === 'expiring');
    return list;
  }, [sessions, search, statusFilter]);

  const stats = {
    total: sessions.length,
    connected: sessions.filter(s => s.online_status === 'online' || s.online_status === 'connected').length,
    offline: sessions.filter(s => s.online_status === 'offline').length,
    expiring: sessions.filter(s => s.session_status === 'expiring').length,
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
          { label: 'Total Installations', value: stats.total, icon: Monitor, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Connected PCs', value: stats.connected, icon: Wifi, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Offline PCs', value: stats.offline, icon: WifiOff, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Expiring Soon', value: stats.expiring, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={s.color} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client, token..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="all">All Status</option>
          <option value="online">Connected</option>
          <option value="offline">Offline</option>
          <option value="expiring">Expiring</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Client', 'Computer', 'Status', 'Last Sync', 'Days Left', 'License', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No offline sessions found</td></tr>
              ) : (
                filtered.map((s: any) => {
                  const isOnline = s.online_status === 'online' || s.online_status === 'connected';
                  const isExpiring = s.session_status === 'expiring';
                  const statusColor = isOnline ? 'text-brand bg-brand-light' : isExpiring ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-100';
                  const statusIcon = isOnline ? Wifi : isExpiring ? Clock : WifiOff;
                  const StatusIcon = statusIcon;
                  return (
                    <tr key={s.id || s.session_token} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{s.company_name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{s.client_email || ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-600">{s.computer_name || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                          <StatusIcon size={12} />
                          {isOnline ? 'Connected' : isExpiring ? 'Expiring' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">
                          {s.last_heartbeat ? new Date(s.last_heartbeat).toLocaleString() : 'Never'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium ${s.days_remaining && s.days_remaining < 3 ? 'text-red-600' : 'text-gray-500'}`}>
                          {s.days_remaining ? `${Math.round(s.days_remaining)}d` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-gray-500">{s.license_key?.slice(0, 16) || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Activity">
                            <ExternalLink size={14} />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand-light rounded-lg transition-colors" title="Force Sync">
                            <RefreshCw size={14} />
                          </button>
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
