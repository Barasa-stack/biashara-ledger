'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Search, Users } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

const SOURCES = ['website', 'referral', 'cold_call', 'social_media', 'event', 'other'] as const;
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'] as const;

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
};

const emptyForm = { name: '', email: '', phone: '', source: 'other', status: 'new', notes: '' };

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-indigo-100 text-indigo-700',
  negotiation: 'bg-orange-100 text-orange-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const sourceLabels: Record<string, string> = {
  website: 'Website',
  referral: 'Referral',
  cold_call: 'Cold Call',
  social_media: 'Social Media',
  event: 'Event',
  other: 'Other',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const fetchLeads = () => {
    setLoading(true); setError('');
    fetch('/api/crm/leads')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then(setLeads)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (statusFilter) list = list.filter(l => l.status === statusFilter);
    if (sourceFilter) list = list.filter(l => l.source === sourceFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q)
      );
    }
    return list;
  }, [leads, statusFilter, sourceFilter, debouncedSearch]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({ name: l.name, email: l.email, phone: l.phone, source: l.source, status: l.status, notes: l.notes });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast('Name is required'); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/crm/leads', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      setShowModal(false);
      fetchLeads();
    } catch (e: any) { toast(e.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (l: Lead) => {
    if (!await confirm(`Delete lead "${l.name}"?`)) return;
    try {
      await fetch('/api/crm/leads', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id }),
      });
      fetchLeads();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const set = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-brand font-medium mb-2">Failed to load</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={fetchLeads} className="mt-4 text-sm text-brand font-medium hover:text-gray-800">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="h-5 w-5 text-brand" /></div>
          <div><h1 className="text-lg font-semibold text-gray-800">Leads</h1><p className="text-xs text-gray-500">Manage incoming leads independently from customers</p></div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search leads by name, email, or phone..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{sourceLabels[s]}</option>)}
        </select>
        {(statusFilter || sourceFilter || searchQuery) && (
          <button onClick={() => { setStatusFilter(''); setSourceFilter(''); setSearchQuery(''); }}
            className="text-xs text-brand font-medium hover:text-gray-800">Clear</button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3 w-8">#</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Email</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Phone</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Source</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Created</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.map((l, i) => (
              <tr key={l.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 pr-3 text-gray-400 w-8">{filteredLeads.length - i}</td>
                <td className="py-3 pr-3 font-medium text-gray-800">{l.name}</td>
                <td className="py-3 pr-3 text-gray-700">{l.email || '—'}</td>
                <td className="py-3 pr-3 text-gray-700">{l.phone || '—'}</td>
                <td className="py-3 pr-3">
                  <span className="text-xs text-gray-600">{sourceLabels[l.source] || l.source}</span>
                </td>
                <td className="py-3 pr-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${statusColors[l.status] || 'bg-gray-100 text-gray-700'}`}>
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 pr-3 text-xs text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openEdit(l)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(l)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm">{leads.length === 0 ? 'No leads yet. Add your first lead.' : 'No leads match your filters'}</p>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">{editing ? 'Edit Lead' : 'Add Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name" value={form.name} onChange={set('name')} required />
                <Field label="Email" value={form.email} onChange={set('email')} type="email" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone" value={form.phone} onChange={set('phone')} />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Source</label>
                  <select value={form.source} onChange={e => set('source')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    {SOURCES.map(s => <option key={s} value={s}>{sourceLabels[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => set('status')(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${
                        form.status === s ? 'bg-brand text-white border-brand' : 'border-border text-gray-600 hover:bg-gray-50'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : (editing ? 'Update Lead' : 'Add Lead')}
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}

function Field({ label, value, onChange, type, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
    </div>
  );
}
