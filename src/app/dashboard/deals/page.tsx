'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Search, Download, TrendingUp } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { PIPELINE_STAGES, formatCurrency } from '@/lib/currencies';

type Deal = {
  id: string;
  deal_name: string;
  customer_id: string;
  customer_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  deal_value: number;
  pipeline_stage: string;
  probability: number;
  expected_close_date: string;
  notes: string;
  status: string;
  created_at: string;
};

type Customer = {
  id: string;
  customer_name: string;
  company_name: string;
};

const emptyForm = {
  deal_name: '',
  customer_id: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  deal_value: 0,
  pipeline_stage: 'lead',
  probability: 10,
  expected_close_date: '',
  notes: '',
};

const getStage = (key: string) => PIPELINE_STAGES.find(s => s.key === key) || PIPELINE_STAGES[0];

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-red-100 text-red-700',
  closed_lost: 'bg-red-100 text-red-700',
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchDeals = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/deals').then(r => r.ok ? r.json() : Promise.reject('Failed to load deals')),
      fetch('/api/customers').then(r => r.ok ? r.json() : Promise.reject('Failed to load customers')),
    ])
      .then(([dealsData, customersData]) => {
        setDeals(dealsData);
        setCustomers(customersData);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDeals(); }, []);

  const filteredDeals = useMemo(() => {
    let list = [...deals];
    if (stageFilter) list = list.filter(d => d.pipeline_stage === stageFilter);
    if (statusFilter) list = list.filter(d => d.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(d =>
        (d.deal_name || '').toLowerCase().includes(q) ||
        (d.customer_name || '').toLowerCase().includes(q) ||
        (d.contact_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [deals, stageFilter, statusFilter, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (d: Deal) => {
    setEditing(d);
    setForm({
      deal_name: d.deal_name,
      customer_id: d.customer_id,
      contact_name: d.contact_name,
      contact_email: d.contact_email,
      contact_phone: d.contact_phone,
      deal_value: d.deal_value,
      pipeline_stage: d.pipeline_stage,
      probability: d.probability,
      expected_close_date: d.expected_close_date?.split('T')[0] || '',
      notes: d.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/deals';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save deal');
      setShowModal(false);
      fetchDeals();
    } catch (e: any) {
      toast(e.message || 'Error saving deal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: Deal) => {
    if (!await confirm(`Delete deal "${d.deal_name}"?`)) return;
    try {
      const res = await fetch('/api/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchDeals();
    } catch (e: any) {
      toast(e.message || 'Error deleting deal');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'deal_name', label: 'Deal Name' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'pipeline_stage', label: 'Pipeline Stage' },
    { key: 'deal_value', label: 'Value' },
    { key: 'expected_close_date', label: 'Expected Close' },
    { key: 'status', label: 'Status' },
  ];

  const exportFileName = `deals-${new Date().toISOString().split('T')[0]}`;

  const totalValue = filteredDeals.reduce((s, d) => s + d.deal_value, 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load deals</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchDeals} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <TrendingUp className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Deals</h1>
            <p className="text-xs text-gray-500">Track your sales pipeline</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Deal
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search deals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Stages</option>
            {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredDeals, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredDeals, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Deals', filteredDeals, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Deals', filteredDeals, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(stageFilter || statusFilter || searchQuery) && (
            <button onClick={() => { setStageFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      {!loading && filteredDeals.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total Pipeline Value</span>
              <p className="text-lg font-semibold text-gray-800">{fmtUSD(totalValue)}</p>
            </div>
            <div>
              <span className="text-gray-500">Deals</span>
              <p className="text-lg font-semibold text-gray-800">{filteredDeals.length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading deals...</span>
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <TrendingUp className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No deals yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Deal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Deal Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Pipeline Stage</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Value</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Expected Close</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeals.map((d, i) => {
                  const stage = getStage(d.pipeline_stage);
                  return (
                    <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-4 text-gray-400 w-8">{filteredDeals.length - i}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{d.deal_name}</td>
                      <td className="py-3 pr-4 text-gray-700">{d.customer_name || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded ${STAGE_COLORS[d.pipeline_stage] || 'bg-gray-100 text-gray-700'}`}>
                          {stage.label}
                          <span className="opacity-70">({stage.probability}%)</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(d.deal_value)}</td>
                      <td className="py-3 pr-4 text-gray-700">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString('en-US') : '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                          d.status === 'won' ? 'bg-red-100 text-red-700' :
                          d.status === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(d)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Deal' : 'Add Deal'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Deal Name" value={form.deal_name} onChange={set('deal_name')} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Customer</label>
                  <select
                    value={form.customer_id}
                    onChange={e => set('customer_id')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Name" value={form.contact_name} onChange={set('contact_name')} />
                <Field label="Contact Email" value={form.contact_email} onChange={set('contact_email')} type="email" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Phone" value={form.contact_phone} onChange={set('contact_phone')} />
                <Field label="Deal Value" value={String(form.deal_value)} onChange={v => set('deal_value')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                  <select
                    value={form.pipeline_stage}
                    onChange={e => {
                      const stage = getStage(e.target.value);
                      set('pipeline_stage')(e.target.value);
                      set('probability')(stage.probability);
                    }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label} ({s.probability}%)</option>)}
                  </select>
                </div>
                <Field label="Probability (%)" value={String(form.probability)} onChange={v => set('probability')(Number(v) || 0)} type="number" />
              </div>
              <Field label="Expected Close Date" value={form.expected_close_date} onChange={set('expected_close_date')} type="date" />
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes')(e.target.value)}
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.deal_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Deal' : 'Add Deal'
                )}
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
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
