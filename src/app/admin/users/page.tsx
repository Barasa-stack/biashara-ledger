'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, UserCircle, CheckCircle2, XCircle, Clock, Loader2,
  Mail, Key, Calendar, ChevronDown, RefreshCw
} from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'trial'>('all');
  const [sortField, setSortField] = useState<'name' | 'email' | 'created'>('created');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          const all = [
            ...(data.real || []).map((u: any) => ({
              id: u.id,
              company_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || '—',
              email: u.email,
              license_key: u.license_key || '',
              is_active: u.verified === 1 || u.verified === true,
              license_active: u.subscription_status === 'active',
              is_trial: u.license_status === 'trial' || u.subscription_plan === 'trial',
              activity_count: 0,
              last_active: null,
              created_at: u.created_at,
            })),
            ...(data.managed || []),
          ];
          setUsers(all);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.company_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.license_key?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') list = list.filter(u => u.is_active && u.license_active);
    else if (statusFilter === 'inactive') list = list.filter(u => !u.is_active || !u.license_active);
    else if (statusFilter === 'trial') list = list.filter(u => u.is_trial);

    if (sortField === 'name') list.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
    else if (sortField === 'email') list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [users, search, statusFilter, sortField]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && u.license_active).length,
    inactive: users.filter(u => !u.is_active || !u.license_active).length,
    trial: users.filter(u => u.is_trial).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-1">Manage all registered users and their licenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-100' },
          { label: 'Active', value: stats.active, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Inactive', value: stats.inactive, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Trial', value: stats.trial, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="trial">Trial</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as any)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          >
            <option value="created">Newest</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">License</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                        <UserCircle size={16} className="text-brand" />
                      </div>
                      <span className="font-medium text-gray-900">{user.company_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail size={12} className="text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Key size={12} className="text-gray-400" />
                      <code className="text-xs text-gray-600">{user.license_key || '—'}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active && user.license_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-2 py-1 rounded-full">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        <XCircle size={10} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{user.activity_count || 0} actions</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={10} />
                      {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={10} />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.license_key?.startsWith('TRIAL') && (
                      <button
                        onClick={async () => {
                          if (!confirm('Generate a new trial key for ' + user.email + '?')) return;
                          try {
                            const res = await fetch('/api/admin/users/regenerate-trial-key', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: user.email }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert('New key generated and ' + (data.email_sent ? 'sent to user!' : 'ready!'));
                              window.location.reload();
                            } else {
                              alert('Error: ' + (data.error || 'Unknown'));
                            }
                          } catch {
                            alert('Network error');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} /> Regenerate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
