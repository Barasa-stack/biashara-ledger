'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Plus, MoreHorizontal, Eye, ToggleLeft, Trash2, X,
  Building2, Mail, Phone, Key, Calendar, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ChevronDown, Filter, Download, Copy, Check
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete'; client: any } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setClients(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.company_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.license_key?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') list = list.filter(c => c.is_active);
    if (statusFilter === 'inactive') list = list.filter(c => !c.is_active);
    return list;
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.is_active).length,
    trial: clients.filter(c => c.is_trial).length,
    expired: clients.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length,
  }), [clients]);

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
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Active', value: stats.active, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Trial', value: stats.trial, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expired', value: stats.expired, color: 'text-orange-600', bg: 'bg-orange-50' },
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                {['Client', 'Email', 'License', 'Plan', 'Status', 'Last Seen', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No clients found</td>
                </tr>
              ) : (
                filteredClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Building2 size={14} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{client.company_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Key size={12} className="text-gray-400" />
                        <span className="text-xs font-mono text-gray-500">{client.license_key?.slice(0, 16)}...</span>
                        {client.license_key && (
                          <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(client.license_key); setCopiedKey(client.id); setTimeout(() => setCopiedKey(null), 2000); }}
                            className="text-gray-400 hover:text-gray-600">
                            {copiedKey === client.id ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${client.is_trial ? 'bg-blue-50 text-blue-700' : 'bg-brand-light text-brand'}`}>
                        {client.is_trial ? 'Trial' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {client.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs text-brand">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400">
                        {client.last_active ? new Date(client.last_active).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); router.push(`/admin/clients/${client.id}`); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'deactivate', client }); }}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title={client.is_active ? 'Deactivate' : 'Activate'}>
                          <ToggleLeft size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'delete', client }); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmAction.type === 'delete' ? 'bg-red-100' : 'bg-orange-100'}`}>
                {confirmAction.type === 'delete' ? <Trash2 size={20} className="text-red-600" /> : <AlertTriangle size={20} className="text-orange-600" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {confirmAction.type === 'delete' ? 'Delete Client' : confirmAction.client.is_active ? 'Deactivate Client' : 'Activate Client'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {confirmAction.type === 'delete'
                    ? 'This will permanently delete this client and all their data.'
                    : `Are you sure you want to ${confirmAction.client.is_active ? 'deactivate' : 'activate'} ${confirmAction.client.company_name}?`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={() => confirmAction.type === 'delete' ? deleteClient(confirmAction.client) : deactivateClient(confirmAction.client)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.client.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
