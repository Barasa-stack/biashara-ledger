'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Users, CheckCircle2, XCircle, Clock, AlertTriangle, MoreVertical, Eye, ToggleLeft, Trash2, X, Building2, Mail, Database, Key, Calendar, Copy, Check, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete'; client: any } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.company_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.database_name?.toLowerCase().includes(q) ||
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

  const createClient = async (formData: { company_name: string; email: string; max_users: number }) => {
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewClient(data.client);
        fetchClients();
      } else {
        alert('Error: ' + (data.error || 'Failed to create client'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleActive = async (client: any) => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/deactivate`, { method: 'POST' });
      if (res.ok) {
        setConfirmAction(null);
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClient = async (client: any) => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmAction(null);
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">BL</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-1">
            {[
              { href: '/admin', label: 'Clients', isActive: true },
              { href: '/admin/licenses', label: 'Licenses', isActive: false },
              { href: '/admin/offline-clients', label: 'Offline', isActive: false },
              { href: '/admin/electron-users', label: 'Electron', isActive: false },
              { href: '/admin/updates', label: 'Updates', isActive: false },
              { href: '/dashboard', label: 'Back', isActive: false },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  link.isActive ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Clients', value: stats.total, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Trial', value: stats.trial, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Expired', value: stats.expired, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                <div className={`${stat.bg} p-1.5 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company, email, database, or license key..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Database</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Trial</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client, i) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                          {client.company_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{client.company_name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{client.email}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-500 font-mono">{client.database_name}</code>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`text-xs ${client.is_trial ? 'text-amber-600' : 'text-gray-400'}`}>
                        {client.trial_end_date ? new Date(client.trial_end_date).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {client.license_key && (
                          <button
                            onClick={() => copyToClipboard(client.license_key)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 relative"
                            title="Copy license key"
                          >
                            {copiedKey === client.license_key ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Key className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ type: 'deactivate', client })}
                          className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${
                            client.is_active ? 'text-amber-500 hover:text-amber-700' : 'text-green-500 hover:text-green-700'
                          }`}
                          title={client.is_active ? 'Deactivate' : 'Reactivate'}
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'delete', client })}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">
                        {search || statusFilter !== 'all' ? 'No clients match your search' : 'No clients yet'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {search || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Add your first client to get started'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {filteredClients.length} of {clients.length} clients
            </p>
          </div>
        </div>
      </main>

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createClient}
        />
      )}

      {/* License Key Modal */}
      {newClient && (
        <LicenseKeyModal
          client={newClient}
          onClose={() => setNewClient(null)}
          onCopy={copyToClipboard}
          copiedKey={copiedKey}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          action={confirmAction.type}
          client={confirmAction.client}
          onConfirm={() => {
            if (confirmAction.type === 'deactivate') handleToggleActive(confirmAction.client);
            if (confirmAction.type === 'delete') handleDeleteClient(confirmAction.client);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function CreateClientModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ company_name: '', email: '', max_users: 5 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Building2 className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
              Company Name
            </label>
            <input type="text" required placeholder="e.g. Acme Construction Ltd"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
              Email Address
            </label>
            <input type="email" required placeholder="client@company.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Users className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
              Max Users
            </label>
            <input type="number" min={1} max={100}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              value={form.max_users}
              onChange={e => setForm(f => ({ ...f, max_users: parseInt(e.target.value) || 5 }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LicenseKeyModal({ client, onClose, onCopy, copiedKey }: { client: any; onClose: () => void; onCopy: (text: string) => void; copiedKey: string | null }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Client Created Successfully</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Share these credentials with the client</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">License Key</p>
            <button
              onClick={() => onCopy(client.license_key)}
              className="text-brand hover:text-brand-hover text-xs font-medium flex items-center gap-1"
            >
              {copiedKey === client.license_key ? (
                <><Check className="h-3 w-3" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
          </div>
          <p className="text-lg font-mono font-bold text-brand break-all select-all bg-white rounded-lg px-3 py-2 border border-gray-200">
            {client.license_key}
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-6">
          {[
            { icon: Building2, label: 'Company', value: client.company_name },
            { icon: Mail, label: 'Email', value: client.email },
            { icon: Database, label: 'Database', value: client.database_name },
            { icon: Calendar, label: 'Trial ends', value: new Date(client.trial_end_date).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <item.icon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 w-20">{item.label}</span>
              <span className="text-xs font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md">
          Done
        </button>
      </div>
    </div>
  );
}

function ConfirmationModal({ action, client, onConfirm, onCancel }: { action: 'deactivate' | 'delete'; client: any; onConfirm: () => void; onCancel: () => void }) {
  const isDeactivate = action === 'deactivate';
  const newStatus = isDeactivate ? !client.is_active : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`w-12 h-12 ${isDeactivate ? 'bg-amber-100' : 'bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
          {isDeactivate
            ? <ToggleLeft className={`h-6 w-6 ${client.is_active ? 'text-amber-600' : 'text-green-600'}`} />
            : <AlertTriangle className="h-6 w-6 text-red-600" />
          }
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          {isDeactivate
            ? `${client.is_active ? 'Deactivate' : 'Reactivate'} Client`
            : 'Delete Client'
          }
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isDeactivate
            ? `Are you sure you want to ${client.is_active ? 'deactivate' : 'reactivate'} "${client.company_name}"? ${client.is_active ? 'They will lose access to the platform.' : 'They will regain access to the platform.'}`
            : `This will permanently delete "${client.company_name}" and drop their database "${client.database_name}". This action cannot be undone.`
          }
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md ${
              isDeactivate
                ? client.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}>
            {isDeactivate
              ? client.is_active ? 'Deactivate' : 'Reactivate'
              : 'Delete'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
