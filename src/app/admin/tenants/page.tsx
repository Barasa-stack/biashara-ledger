'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Building2, Trash2, X, AlertTriangle,
  CheckCircle2, Loader2, Clock, Ban
} from 'lucide-react';

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return []; }
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) setTenants(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter((t: any) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.company_name || '').toLowerCase().includes(q) ||
      (t.user_emails || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter((t: any) => t.is_active).length,
    selfRegistered: tenants.filter((t: any) => t.source === 'self_registered').length,
    managed: tenants.filter((t: any) => t.source === 'managed').length,
  }), [tenants]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);
    try {
      const res = await fetch(`/api/admin/tenants/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setTenants(prev => prev.filter((t: any) => t.id !== deleteTarget.id));
        setDeleteResult({ success: true, message: data.message || 'Tenant deleted' });
      } else {
        setDeleteResult({ success: false, message: data.error || 'Failed to delete tenant' });
      }
    } catch {
      setDeleteResult({ success: false, message: 'Network error' });
    }
    setDeleting(false);
    setDeleteTarget(null);
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
          { label: 'Total Tenants', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Active', value: stats.active, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Managed', value: stats.managed, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Self-Registered', value: stats.selfRegistered, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Delete result toast */}
      {deleteResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          deleteResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {deleteResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {deleteResult.message}
          <button onClick={() => setDeleteResult(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants by name, email, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No tenants found</td></tr>
              ) : (
                filtered.map((t: any) => {
                  const firstEmail = t.user_emails?.split(', ')?.[0] || '';
                  const isActive = t.is_active;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                            <Building2 size={14} className="text-brand" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.company_name || t.name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-400 font-mono">{t.id?.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-900">{t.user_count || 0}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{firstEmail}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          t.source === 'managed' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {t.source === 'managed' ? 'Managed' : 'Self-Registered'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          isActive ? 'text-brand bg-brand-light' : 'text-gray-500 bg-gray-100'
                        }`}>
                          {isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">{t.created ? new Date(t.created).toLocaleDateString() : 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">{t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => { setDeleteTarget(t); setDeleteResult(null); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete tenant"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Delete Tenant</h2>
              <button onClick={() => !deleting && setDeleteTarget(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg" disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
                  <p className="text-xs text-red-700 mt-1">
                    This will permanently delete the tenant <strong>{deleteTarget.company_name || deleteTarget.name || 'Unnamed'}</strong>
                    ({deleteTarget.id?.substring(0, 8)}...) and all associated:
                  </p>
                  <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-0.5">
                    <li>User accounts ({deleteTarget.user_count || 0} users)</li>
                    <li>Sessions and authentication data</li>
                    <li>Admin client record (if managed)</li>
                    <li>License keys</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Delete Tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
