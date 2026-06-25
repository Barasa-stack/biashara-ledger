'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState<{ company_name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.status === 401 || res.status === 403) {
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

  const toggleActive = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/clients/${id}/deactivate`, { method: 'POST' });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteClient = async (id: number, dbName: string) => {
    if (!confirm(`Delete client and drop database "${dbName}"? This cannot be undone!`)) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">BiasharaLedger Admin</h1>
        </div>
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">Back to App</a>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Client Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover text-sm font-semibold"
          >
            + Add Client
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{clients.filter(c => c.is_active).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Trial</p>
            <p className="text-2xl font-bold text-yellow-600">{clients.filter(c => c.is_trial).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-2xl font-bold text-red-600">{clients.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Database</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Trial Ends</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client, i) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{client.company_name}</td>
                  <td className="px-4 py-3">{client.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{client.database_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{client.trial_end_date ? new Date(client.trial_end_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/clients/${client.id}`)} className="text-blue-600 hover:text-blue-800 text-xs">View</button>
                    <button onClick={() => toggleActive(client.id)} className={`text-xs ${client.is_active ? 'text-yellow-600' : 'text-green-600'} hover:opacity-80`}>
                      {client.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button onClick={() => deleteClient(client.id, client.database_name)} className="text-red-600 hover:text-red-800 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No clients yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createClient}
        />
      )}

      {newClient && (
        <LicenseKeyModal client={newClient} onClose={() => setNewClient(null)} />
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-md text-sm" value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required className="w-full px-3 py-2 border rounded-md text-sm" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
            <input type="number" className="w-full px-3 py-2 border rounded-md text-sm" value={form.max_users}
              onChange={e => setForm(f => ({ ...f, max_users: parseInt(e.target.value) || 5 }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm hover:bg-brand-hover disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LicenseKeyModal({ client, onClose }: { client: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Client Created</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-xs text-gray-500 mb-1">License Key</p>
          <p className="text-lg font-mono font-bold text-brand break-all select-all">{client.license_key}</p>
        </div>
        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <p><strong>Company:</strong> {client.company_name}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Database:</strong> <span className="font-mono">{client.database_name}</span></p>
          <p><strong>Trial:</strong> 14 days (ends {new Date(client.trial_end_date).toLocaleDateString()})</p>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-brand text-white rounded-md text-sm hover:bg-brand-hover">Done</button>
        </div>
      </div>
    </div>
  );
}
