'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Plus, Eye, ToggleLeft, Trash2, X, Clock,
  Building2, Mail, Key, CheckCircle2, XCircle,
  AlertTriangle, Loader2
} from 'lucide-react';

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8"><Loader2 className="animate-spin" /></div>}>
      <ClientsPageContent />
    </Suspense>
  );
}

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'self_registered'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete' | 'activate'; client: any } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ company_name: '', email: '', max_users: 5, password: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(async r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return []; }
        const text = await r.text();
        if (!text) return [];
        try { return JSON.parse(text); }
        catch { return []; }
      })
      .then(data => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.company_name || c.email || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.license_key || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') return list.filter(c => c.is_active);
    if (statusFilter === 'inactive') return list.filter(c => !c.is_active);
    if (statusFilter === 'pending') return list.filter(c => c.source === 'self_registered' && (!c.subscription_status || c.subscription_status !== 'active'));
    if (statusFilter === 'self_registered') return list.filter(c => c.source === 'self_registered');
    return list;
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.is_active).length,
    trial: clients.filter(c => c.is_trial).length,
    expired: clients.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length,
    selfRegistered: clients.filter(c => c.source === 'self_registered').length,
  }), [clients]);

  const createClient = async () => {
    if (!newClient.company_name.trim() || !newClient.email.trim() || !newClient.password.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create client'); return; }
      setShowCreateModal(false);
      setNewClient({ company_name: '', email: '', max_users: 5, password: '' });
      setClients(prev => [data.client, ...prev]);
    } catch { setCreateError('Failed to create client'); }
    finally { setCreating(false); }
  };

  const deactivateClient = async (client: any) => {
    try {
      await fetch(`/api/admin/clients/${client.id}/deactivate`, { method: 'POST' });
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: !c.is_active } : c));
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const deleteClient = async (client: any) => {
    try {
      await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== client.id));
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const activateClient = async (client: any) => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_users: 5 }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to activate'); return; }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, ...data.client } : c));
    } catch { setCreateError('Failed to activate'); }
    setConfirmAction(null);
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
      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Active', value: stats.active, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Trial', value: stats.trial, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expired', value: stats.expired, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Self Registered', value: stats.selfRegistered, color: 'text-purple-600', bg: 'bg-purple-50' },
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
              placeholder="Search by name, email, or license..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending Activation</option>
            <option value="self_registered">Self Registered</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Client', 'Email', 'Source', 'Plan', 'Status', 'Expiry', 'Last Seen', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">No clients found</td>
                </tr>
              ) : (
                filteredClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${client.source === 'self_registered' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                          <Building2 size={14} className={client.source === 'self_registered' ? 'text-purple-600' : 'text-blue-600'} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{client.company_name || '—'}</span>
                          {client.source === 'self_registered' && <span className="ml-2 text-xs text-purple-600">(Self Registered)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        client.source === 'self_registered' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {client.source === 'self_registered' ? 'Self Registered' : 'Managed'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        client.is_trial ? 'bg-blue-50 text-blue-700' :
                        client.subscription_plan === 'premium' || client.plan === 'premium' ? 'bg-violet-50 text-violet-700' :
                        client.subscription_plan === 'standard' || client.plan === 'standard' ? 'bg-brand-light text-brand' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {client.subscription_plan || client.plan ? (client.subscription_plan || client.plan).charAt(0).toUpperCase() + (client.subscription_plan || client.plan).slice(1) : client.is_trial ? 'Trial' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {client.subscription_status === 'active' || client.license_status === 'active' ? (
                          <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : client.subscription_status === 'trial' || client.is_trial ? (
                          <span className="flex items-center gap-1.5 text-xs text-blue-600">
                            <Clock size={12} /> Trial
                          </span>
                        ) : client.subscription_status === 'expired' || (client.expires_at && new Date(client.expires_at) < new Date()) ? (
                          <span className="flex items-center gap-1.5 text-xs text-red-600">
                            <XCircle size={12} /> Expired
                          </span>
                        ) : client.is_active ? (
                          <span className="flex items-center gap-1.5 text-xs text-brand">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400">
                        {client.expires_at ? new Date(client.expires_at).toLocaleDateString() : client.subscription_expiry ? new Date(client.subscription_expiry).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400">
                        {client.last_active ? new Date(client.last_active).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {client.source === 'self_registered' && (!client.subscription_status || client.subscription_status !== 'active') && (
                          <button onClick={() => setConfirmAction({ type: 'activate', client })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                            <Key size={12} /> Activate
                          </button>
                        )}
                        <button onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        {client.source !== 'self_registered' && (
                          <>
                            <button onClick={() => setConfirmAction({ type: 'deactivate', client })}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title={client.is_active ? 'Deactivate' : 'Activate'}>
                              <ToggleLeft size={14} />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'delete', client })}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateModal(false); setCreateError(''); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Add Client</h3>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newClient.company_name}
                  onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@acme.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max Users</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newClient.max_users}
                  onChange={e => setNewClient(p => ({ ...p, max_users: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Password (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newClient.password}
                    onChange={e => setNewClient(p => ({ ...p, password: e.target.value }))}
                    placeholder="Set initial password"
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Eye size={14} />
                  </button>
                </div>
              </div>
              {createError && <p className="text-xs text-red-500">{createError}</p>}
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={createClient} disabled={creating || !newClient.company_name.trim() || !newClient.email.trim() || !newClient.password.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin inline" /> : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmAction.type === 'delete' ? 'bg-red-100' : confirmAction.type === 'activate' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                {confirmAction.type === 'delete' ? <Trash2 size={20} className="text-red-600" /> : confirmAction.type === 'activate' ? <Key size={20} className="text-purple-600" /> : <AlertTriangle size={20} className="text-orange-600" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {confirmAction.type === 'delete' ? 'Delete Client' : confirmAction.type === 'activate' ? 'Activate Client (1 Year Premium)' : confirmAction.client.is_active ? 'Deactivate Client' : 'Activate Client'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {confirmAction.type === 'delete'
                    ? 'This will permanently delete this client and all their data.'
                    : confirmAction.type === 'activate'
                    ? `Activate ${confirmAction.client.company_name || confirmAction.client.email} with a 1-year Premium subscription.`
                    : `Are you sure you want to ${confirmAction.client.is_active ? 'deactivate' : 'activate'} ${confirmAction.client.company_name}?`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={() => confirmAction.type === 'delete' ? deleteClient(confirmAction.client) : confirmAction.type === 'activate' ? activateClient(confirmAction.client) : deactivateClient(confirmAction.client)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : confirmAction.type === 'activate' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'activate' ? 'Activate' : confirmAction.client.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
