'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Webhook, Copy, CheckCircle, Search, Pencil, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type WebhookEvent = {
  id: string;
  webhook_id: string;
  event: string;
};

type Webhook = {
  id: string;
  webhook_name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
};

type NewWebhookResponse = {
  webhook: Webhook;
  secret: string;
};

const AVAILABLE_EVENTS = [
  { value: 'invoice.created', label: 'Invoice Created' },
  { value: 'invoice.paid', label: 'Invoice Paid' },
  { value: 'payment.received', label: 'Payment Received' },
  { value: 'expense.created', label: 'Expense Created' },
  { value: 'customer.created', label: 'Customer Created' },
];

const emptyForm = {
  webhook_name: '',
  url: '',
  events: ['invoice.paid'] as string[],
  is_active: true,
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newWebhookData, setNewWebhookData] = useState<NewWebhookResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchWebhooks = () => {
    setLoading(true);
    setError('');
    fetch('/api/webhooks')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load webhooks'))
      .then(setWebhooks)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setNewWebhookData(null);
    setCopied(false);
    setShowModal(true);
  };

  const openEdit = (w: Webhook) => {
    setEditing(w);
    setForm({
      webhook_name: w.webhook_name,
      url: w.url,
      events: w.events.map(e => e.event),
      is_active: w.is_active,
    });
    setNewWebhookData(null);
    setShowModal(true);
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const set = (field: string) => (v: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/webhooks';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save webhook');
      if (!editing) {
        const data: NewWebhookResponse = await res.json();
        setNewWebhookData(data);
      }
      fetchWebhooks();
    } catch (e: any) {
      toast(e.message || 'Error saving webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: Webhook) => {
    if (!await confirm(`Delete webhook "${w.webhook_name}"?`)) return;
    try {
      const res = await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchWebhooks();
    } catch (e: any) {
      toast(e.message || 'Error deleting webhook');
    }
  };

  const handleCopy = () => {
    if (newWebhookData) {
      navigator.clipboard.writeText(newWebhookData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filteredWebhooks = webhooks.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return w.webhook_name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q);
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load webhooks</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchWebhooks} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Webhook className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Webhooks</h1>
            <p className="text-xs text-gray-500">Configure outgoing webhook integrations</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Webhook
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search webhooks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
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
              <span className="text-sm text-gray-600">Loading webhooks...</span>
            </div>
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Webhook className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No webhooks configured</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Webhook
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">URL</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Events</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Last Triggered</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Active</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWebhooks.map(w => (
                  <tr key={w.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{w.webhook_name}</td>
                    <td className="py-3 pr-4 max-w-[200px] truncate">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{w.url}</code>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {w.events.map(ev => (
                          <span key={ev.id} className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                            {ev.event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 text-xs">{w.last_triggered_at ? new Date(w.last_triggered_at).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${w.is_active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {w.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(w)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(w)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                {editing ? 'Edit Webhook' : newWebhookData ? 'Webhook Created' : 'Add Webhook'}
              </h2>
              <button onClick={() => { setShowModal(false); setNewWebhookData(null); }} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {newWebhookData ? (
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">Webhook created successfully</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-700 mb-2">Webhook Secret — Copy this now. You won't see it again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white border border-border rounded px-3 py-2 font-mono text-gray-800 break-all select-all">
                      {newWebhookData.secret}
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
                  onClick={() => { setShowModal(false); setNewWebhookData(null); }}
                  className="w-full text-xs font-medium text-gray-600 px-4 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Webhook Name</label>
                    <input
                      type="text"
                      value={form.webhook_name}
                      onChange={e => set('webhook_name')(e.target.value)}
                      required
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">URL</label>
                    <input
                      type="url"
                      value={form.url}
                      onChange={e => set('url')(e.target.value)}
                      placeholder="https://example.com/webhook"
                      required
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Events</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_EVENTS.map(ev => (
                        <label key={ev.value} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                          <input
                            type="checkbox"
                            checked={form.events.includes(ev.value)}
                            onChange={() => toggleEvent(ev.value)}
                            className="rounded border-border text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-gray-700">{ev.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={e => set('is_active')(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !form.webhook_name.trim() || !form.url.trim() || form.events.length === 0}
                    className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editing ? 'Update Webhook' : 'Add Webhook'
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
