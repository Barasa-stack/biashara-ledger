'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key, Copy, Check, Search, Loader2, RefreshCw,
  AlertTriangle, XCircle, CheckCircle2, Clock, ExternalLink,
  Plus, Ban, Repeat,
} from 'lucide-react';

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; license: any } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchLicenses(); }, []);

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/admin/licenses');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

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
    if (statusFilter === 'active') list = list.filter(l => l.is_active && l.is_used);
    if (statusFilter === 'unused') list = list.filter(l => !l.is_used);
    if (statusFilter === 'revoked') list = list.filter(l => !l.is_active);
    if (statusFilter === 'expired') list = list.filter(l => l.expires_at && new Date(l.expires_at) < new Date());
    return list;
  }, [licenses, search, statusFilter]);

  const stats = useMemo(() => ({
    total: licenses.length,
    active: licenses.filter(l => l.is_active && l.is_used).length,
    unused: licenses.filter(l => !l.is_used).length,
    revoked: licenses.filter(l => !l.is_active).length,
    expired: licenses.filter(l => l.expires_at && new Date(l.expires_at) < new Date()).length,
  }), [licenses]);

  const copyKey = async (key: string) => {
    try { await navigator.clipboard.writeText(key); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000); } catch {}
  };

  const handleLicenseAction = async (action: string, license: any) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: license.license_key, clientId: license.client_id, action, days: 365 }),
      });
      if (res.ok) {
        setConfirmAction(null);
        fetchLicenses();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Action failed'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
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
            <h1 className="text-lg font-bold text-gray-900">License Management</h1>
          </div>
          <div className="flex items-center gap-1">
            <a href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Clients</a>
            <a href="/admin/licenses" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand/10 text-brand transition-colors">Licenses</a>
            <a href="/admin/offline-clients" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Offline</a>
            <a href="/admin/electron-users" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Electron</a>
            <a href="/admin/updates" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Updates</a>
            <a href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Back</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All License Keys</h2>
            <p className="text-sm text-gray-500 mt-1">{licenses.length} total license(s)</p>
          </div>
          <button onClick={() => setShowGenerate(true)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md flex items-center gap-2">
            <Plus className="h-4 w-4" /> Generate License
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Key, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Unused', value: stats.unused, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Revoked', value: stats.revoked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
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
              <input type="text" placeholder="Search by key, company, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unused">Unused</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">License Key</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Sessions</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Hardware</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Expires</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 break-all">{l.license_key}</code>
                        <button onClick={() => copyKey(l.license_key)} className="p-1 hover:bg-gray-100 rounded shrink-0">
                          {copiedKey === l.license_key ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div>
                        <p className="text-gray-900">{l.company_name || '-'}</p>
                        <p className="text-xs text-gray-400">{l.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {l.is_active && l.is_used ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                        </span>
                      ) : l.is_active && !l.is_used ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{l.active_sessions || 0}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {l.hardware_fingerprint ? (
                        <code className="text-[10px] font-mono text-gray-400 truncate block max-w-[120px]">{l.hardware_fingerprint.substring(0, 20)}...</code>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">
                      {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {l.is_active ? (
                          <button onClick={() => setConfirmAction({ action: 'revoke', license: l })}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600" title="Revoke">
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => setConfirmAction({ action: 'reactivate', license: l })}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-green-400 hover:text-green-600" title="Reactivate">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => setConfirmAction({ action: 'extend', license: l })}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600" title="Extend">
                          <Clock className="h-4 w-4" />
                        </button>
                        {l.client_id && (
                          <button onClick={() => router.push(`/admin/clients/${l.client_id}`)}
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
                    <Key className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No licenses found</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
            Showing {filtered.length} of {licenses.length} licenses
          </div>
        </div>
      </main>

      {showGenerate && (
        <GenerateLicenseModal onClose={() => setShowGenerate(false)} onGenerated={fetchLicenses} />
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-12 ${confirmAction.action === 'revoke' ? 'bg-red-100' : 'bg-amber-100'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              {confirmAction.action === 'revoke' ? <Ban className="h-6 w-6 text-red-600" /> : <RefreshCw className="h-6 w-6 text-amber-600" />}
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              {confirmAction.action === 'revoke' ? 'Revoke License' : confirmAction.action === 'reactivate' ? 'Reactivate License' : 'Extend License'}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmAction.action === 'revoke'
                ? 'This will disable the license and end all active sessions. The client will lose access immediately.'
                : confirmAction.action === 'reactivate'
                ? 'This will re-enable the license and allow the client to reactivate.'
                : 'This will extend the license expiry by 365 days.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleLicenseAction(
                confirmAction.action === 'extend' ? 'extend' : confirmAction.action, confirmAction.license
              )}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md ${
                  confirmAction.action === 'revoke' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-hover'
                }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenerateLicenseModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        onGenerated();
      } else {
        alert('Error: ' + (data.error || 'Generation failed'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    finally { setLoading(false); }
  };

  const copyKey = async () => {
    if (!result?.licenseKey) return;
    try { await navigator.clipboard.writeText(result.licenseKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {!result ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Generate License Key</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
                <input type="email" required placeholder="client@company.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                  value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : 'Generate'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">License Generated</h2>
            <p className="text-sm text-gray-500 text-center mb-6">New license key created successfully</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">License Key</p>
                <button onClick={copyKey} className="text-brand hover:text-brand-hover text-xs font-medium flex items-center gap-1">
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <p className="text-base font-mono font-bold text-brand break-all select-all bg-white rounded-lg px-3 py-2 border border-gray-200">
                {result.licenseKey}
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500">Client</span>
                <span className="text-xs font-medium text-gray-900">{result.client?.companyName}</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500">Email</span>
                <span className="text-xs font-medium text-gray-900">{result.client?.email}</span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md">Done</button>
          </>
        )}
      </div>
    </div>
  );
}
