'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor, Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, XCircle,
  Search, Loader2, RefreshCw, ExternalLink, Copy, Check,
} from 'lucide-react';

export default function AdminOfflineClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/offline-clients');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.company_name?.toLowerCase().includes(q) ||
        c.license_key?.toLowerCase().includes(q) ||
        c.user_email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'online') list = list.filter(c => c.online_status === 'online');
    if (statusFilter === 'offline') list = list.filter(c => c.online_status === 'offline' || c.online_status === 'recent' || c.online_status === 'never');
    if (statusFilter === 'expiring') list = list.filter(c => c.session_status === 'expiring');
    if (statusFilter === 'expired') list = list.filter(c => c.session_status === 'expired');
    return list;
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => ({
    total: clients.length,
    online: clients.filter(c => c.online_status === 'online').length,
    offline: clients.filter(c => c.online_status === 'offline' || c.online_status === 'recent').length,
    expiring: clients.filter(c => c.session_status === 'expiring').length,
  }), [clients]);

  const getOnlineIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'recent': return <WifiOff className="h-4 w-4 text-amber-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOnlineLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'recent': return 'Recent';
      case 'offline': return 'Offline';
      default: return 'Never';
    }
  };

  const copyKey = async (key: string) => {
    try { await navigator.clipboard.writeText(key); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000); } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-3" /><p className="text-sm text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><span className="text-white text-xs font-bold">BL</span></div>
            <h1 className="text-lg font-bold text-gray-900">Offline Clients</h1>
          </div>
          <div className="flex items-center gap-1">
            <a href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Clients</a>
            <a href="/admin/licenses" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Licenses</a>
            <a href="/admin/offline-clients" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand/10 text-brand transition-colors">Offline</a>
            <a href="/admin/electron-users" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Electron</a>
            <a href="/admin/updates" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Updates</a>
            <a href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Back</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Session Monitoring</h2>
            <p className="text-sm text-gray-500 mt-1">{clients.length} active session(s)</p>
          </div>
          <button onClick={fetchClients}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sessions', value: stats.total, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Online Now', value: stats.online, icon: Wifi, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Offline', value: stats.offline, icon: WifiOff, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Expiring Soon', value: stats.expiring, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <div className={`${s.bg} p-1.5 rounded-lg`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search by company, license, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Online</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Days Left</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Last Heartbeat</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">IP</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                          {c.company_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.company_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{c.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.session_status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                        </span>
                      ) : c.session_status === 'expiring' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Expiring
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {c.session_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {getOnlineIcon(c.online_status)}
                        <span className="text-xs text-gray-600">{getOnlineLabel(c.online_status)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {c.days_remaining !== null ? (
                        <span className={`text-sm font-medium ${c.days_remaining <= 1 ? 'text-red-600' : c.days_remaining <= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {Math.ceil(c.days_remaining)}d
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">
                      {c.last_heartbeat ? new Date(c.last_heartbeat).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <code className="text-[10px] font-mono text-gray-400">{c.last_ip || '-'}</code>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyKey(c.license_key)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600" title="Copy license">
                          {copiedKey === c.license_key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                        {c.client_id && (
                          <button onClick={() => router.push(`/admin/clients/${c.client_id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600" title="View client">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <Monitor className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No offline sessions found</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
            Showing {filtered.length} of {clients.length} sessions
          </div>
        </div>
      </main>
    </div>
  );
}
