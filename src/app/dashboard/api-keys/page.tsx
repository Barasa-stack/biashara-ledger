'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Key, Copy, CheckCircle, Search, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type ApiKey = {
  id: string;
  key_name: string;
  masked_key: string;
  permissions: string;
  last_used: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type NewKeyResponse = {
  key: ApiKey;
  full_key: string;
};

const emptyForm = {
  key_name: '',
  permissions: 'read',
  expires_in_days: 30,
};

const PERMISSIONS = ['read', 'read_write', 'full'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newKeyData, setNewKeyData] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchKeys = () => {
    setLoading(true);
    setError('');
    fetch('/api/api-keys')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load API keys'))
      .then(setKeys)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setNewKeyData(null);
    setCopied(false);
    setShowModal(true);
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create API key');
      const data: NewKeyResponse = await res.json();
      setNewKeyData(data);
      fetchKeys();
    } catch (e: any) {
      toast(e.message || 'Error creating API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (!await confirm(`Revoke API key "${key.key_name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key.id }),
      });
      if (!res.ok) throw new Error('Failed to revoke key');
      fetchKeys();
    } catch (e: any) {
      toast(e.message || 'Error revoking key');
    }
  };

  const handleCopy = () => {
    if (newKeyData) {
      navigator.clipboard.writeText(newKeyData.full_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filteredKeys = keys.filter(k => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return k.key_name.toLowerCase().includes(q) || k.masked_key.toLowerCase().includes(q);
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load API keys</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchKeys} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">API Keys</h1>
            <p className="text-xs text-gray-500">Manage API keys for integrations</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search keys..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-brand font-medium hover:text-gray-800">Clear</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading API keys...</span>
            </div>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Key className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No API keys created yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Create Your First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Key</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Permissions</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Last Used</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Expires</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Active</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.map(k => (
                  <tr key={k.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{k.key_name}</td>
                    <td className="py-3 pr-4">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{k.masked_key}</code>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded capitalize">{k.permissions.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 text-xs">{k.last_used ? new Date(k.last_used).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4 text-gray-700 text-xs">{k.expires_at ? new Date(k.expires_at).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${k.is_active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {k.is_active && (
                        <button onClick={() => handleRevoke(k)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Revoke">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {newKeyData ? 'API Key Created' : 'Create API Key'}
              </h2>
              <button onClick={() => { setShowModal(false); setNewKeyData(null); }} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {newKeyData ? (
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">API key created successfully</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-700 mb-2">Copy this key now. You won't see it again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white border border-border rounded px-3 py-2 font-mono text-gray-800 break-all select-all">
                      {newKeyData.full_key}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-hover transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <><CheckCircle className="h-3.5 w-3.5" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); setNewKeyData(null); }}
                  className="w-full text-xs font-medium text-gray-600 px-4 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Key Name</label>
                    <input
                      type="text"
                      value={form.key_name}
                      onChange={e => set('key_name')(e.target.value)}
                      placeholder="e.g. Production API Key"
                      required
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Permissions</label>
                      <select
                        value={form.permissions}
                        onChange={e => set('permissions')(e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      >
                        {PERMISSIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Expires In (days)</label>
                      <input
                        type="number"
                        value={form.expires_in_days}
                        onChange={e => set('expires_in_days')(Number(e.target.value) || 30)}
                        min={1}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !form.key_name.trim()}
                    className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
