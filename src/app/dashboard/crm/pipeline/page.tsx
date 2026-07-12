'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Search, Download, TrendingUp, GripVertical } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { PIPELINE_STAGES } from '@/lib/currencies';

type Deal = {
  id: string;
  deal_name: string;
  lead_id: string;
  customer_id: string;
  customer_name: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  deal_value: number;
  currency: string;
  pipeline_stage: string;
  probability: number;
  expected_close_date: string;
  notes: string;
  status: string;
  lost_reason: string;
  created_at: string;
};

type Lead = { id: string; name: string; email: string; phone: string; source: string; status: string; };

const emptyForm = {
  deal_name: '', lead_id: '', customer_id: '', contact_name: '', contact_email: '', contact_phone: '',
  deal_value: 0, currency: 'KES', pipeline_stage: 'lead', probability: 10,
  expected_close_date: '', notes: '', lost_reason: '',
};

const getStage = (key: string) => PIPELINE_STAGES.find(s => s.key === key) || PIPELINE_STAGES[0];

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700', qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700', negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700', closed_lost: 'bg-red-100 text-red-700',
};

const STAGE_BG: Record<string, string> = {
  lead: '#6b7280', qualified: '#2563eb', proposal: '#9333ea',
  negotiation: '#ea580c', closed_won: '#16a34a', closed_lost: '#dc2626',
};

function daysInStage(created: string): number {
  if (!created) return 0;
  return Math.floor((Date.now() - new Date(created).getTime()) / 86400000);
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchDeals = () => {
    setLoading(true); setError('');
    Promise.all([
      fetch('/api/deals').then(r => r.ok ? r.json() : Promise.reject('Failed to load')),
      fetch('/api/crm/leads').then(r => r.ok ? r.json() : []),
    ])
      .then(([d, l]) => { setDeals(d); setLeads(l); })
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
        (d.lead_name || d.customer_name || '').toLowerCase().includes(q) ||
        (d.contact_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [deals, stageFilter, statusFilter, debouncedSearch]);

  const stageTotals = useMemo(() => {
    const active = deals.filter(d => d.status === 'active' || d.status === 'open');
    return PIPELINE_STAGES.map(s => {
      const stageDeals = active.filter(d => d.pipeline_stage === s.key);
      const total = stageDeals.reduce((sum, d) => sum + d.deal_value, 0);
      const weighted = stageDeals.reduce((sum, d) => sum + d.deal_value * (d.probability / 100), 0);
      return { ...s, deals: stageDeals, total, weighted, count: stageDeals.length };
    });
  }, [deals]);

  const totalValue = filteredDeals.reduce((s, d) => s + d.deal_value, 0);
  const totalWeighted = filteredDeals.filter(d => d.status === 'active' || d.status === 'open')
    .reduce((s, d) => s + d.deal_value * (d.probability / 100), 0);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (d: Deal) => {
    setEditing(d);
    setForm({
      deal_name: d.deal_name, lead_id: d.lead_id || '', customer_id: d.customer_id,
      contact_name: d.contact_name, contact_email: d.contact_email, contact_phone: d.contact_phone,
      deal_value: d.deal_value, currency: d.currency || 'KES',
      pipeline_stage: d.pipeline_stage, probability: d.probability,
      expected_close_date: d.expected_close_date?.split('T')[0] || '',
      notes: d.notes, lost_reason: d.lost_reason || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/deals', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json().catch(() => ({}));
      const dealId = editing?.id || data.id;
      if (form.pipeline_stage === 'closed_won' && form.lead_id && !form.customer_id && dealId) {
        await convertLeadToCustomer(form.lead_id, form.deal_name, dealId);
      }
      setShowModal(false);
      fetchDeals();
    } catch (e: any) { toast(e.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (d: Deal) => {
    if (!await confirm(`Delete "${d.deal_name}"?`)) return;
    try {
      await fetch('/api/deals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id }) });
      fetchDeals();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const convertLeadToCustomer = async (leadId: string, dealName: string, dealId: string) => {
    const lead = leads.find(l => l.id === leadId);
    const deal = deals.find(d => d.id === dealId);
    if (!lead) return;
    const custRes = await fetch('/api/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: lead.name, email_address: lead.email,
        phone_number: lead.phone, notes: `Converted from lead via deal ${dealName}`,
      }),
    });
    if (custRes.ok) {
      const cust = await custRes.json();
      if (deal) {
        await fetch('/api/deals', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...deal, customer_id: cust.id, id: dealId }),
        });
      }
      toast('Lead converted to customer');
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    const stage = getStage(newStage);
    try {
      await fetch('/api/deals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deal, pipeline_stage: newStage, probability: stage.probability,
          status: newStage === 'closed_won' ? 'won' : newStage === 'closed_lost' ? 'lost' : 'active',
        }),
      });
      if (newStage === 'closed_won' && deal.lead_id && !deal.customer_id) {
        await convertLeadToCustomer(deal.lead_id, deal.deal_name, dealId);
      }
      fetchDeals();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'deal_name', label: 'Deal Name' }, { key: 'lead_name', label: 'Lead' },
    { key: 'pipeline_stage', label: 'Stage' }, { key: 'deal_value', label: 'Value' },
    { key: 'expected_close_date', label: 'Close Date' }, { key: 'status', label: 'Status' },
  ];
  const exportFileName = `pipeline-${new Date().toISOString().split('T')[0]}`;

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><p className="text-brand font-medium mb-2">Failed to load</p><p className="text-sm text-gray-600">{error}</p>
      <button onClick={fetchDeals} className="mt-4 text-sm text-brand font-medium hover:text-gray-800">Retry</button></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-brand" /></div>
          <div><h1 className="text-lg font-semibold text-gray-800">Pipeline</h1><p className="text-xs text-gray-500">Manage your sales pipeline</p></div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors"><Plus className="h-4 w-4" /> Add Deal</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stageTotals.filter(s => s.key !== 'closed_lost' && s.key !== 'closed_won').map(s => (
          <div key={s.key} className="bg-white rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className="text-xs text-gray-400">{s.count}</span>
            </div>
            <p className="text-base font-bold text-gray-800">{fmtKES(s.total)}</p>
            <p className="text-xs text-gray-400">Weighted: {fmtKES(s.weighted)}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${deals.length > 0 ? (s.total / Math.max(...stageTotals.map(x => x.total)) * 100) : 0}%`, background: STAGE_BG[s.key] }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-6 text-sm">
          <div><span className="text-gray-500">Total Pipeline</span><p className="text-lg font-semibold text-gray-800">{fmtKES(totalValue)}</p></div>
          <div><span className="text-gray-500">Weighted Forecast</span><p className="text-lg font-semibold text-brand">{fmtKES(totalWeighted)}</p></div>
          <div><span className="text-gray-500">Deals</span><p className="text-lg font-semibold text-gray-800">{filteredDeals.length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search deals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Stages</option>
            {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option> <option value="won">Won</option> <option value="lost">Lost</option>
          </select>
          <div className="flex items-center border border-border rounded-md overflow-hidden text-sm">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 ${viewMode === 'table' ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Table</button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 ${viewMode === 'kanban' ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Kanban</button>
          </div>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredDeals, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredDeals, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={() => exportPDF('Pipeline', filteredDeals, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Pipeline', filteredDeals, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word</button>
            </div>
          </div>
          {(stageFilter || statusFilter || searchQuery) && (
            <button onClick={() => { setStageFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear</button>
          )}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
          {PIPELINE_STAGES.filter(s => s.key !== 'closed_lost').map(stage => {
            const stageDeals = filteredDeals.filter(d => d.pipeline_stage === stage.key && d.status !== 'lost');
            return (
              <div key={stage.key} className="bg-gray-50 rounded-lg border border-border min-w-[200px]">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">{stageDeals.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageDeals.map(d => (
                    <div key={d.id} className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(d)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{d.deal_name}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{d.probability}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{d.lead_name || d.customer_name || '—'}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-2">{fmtKES(d.deal_value)}</p>
                      {d.expected_close_date && <p className="text-xs text-gray-400 mt-1">Close: {new Date(d.expected_close_date).toLocaleDateString()}</p>}
                    </div>
                  ))}
                  {stageDeals.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No deals</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3 w-8">#</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Deal Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Lead / Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Stage</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Value</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Weighted</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Days</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Close</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeals.map((d, i) => {
                const stage = getStage(d.pipeline_stage);
                return (
                  <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-3 text-gray-400 w-8">{filteredDeals.length - i}</td>
                    <td className="py-3 pr-3 font-medium text-gray-800">
                      {d.deal_name}
                      {d.lost_reason && <p className="text-xs text-red-500 mt-0.5">{d.lost_reason}</p>}
                    </td>
                    <td className="py-3 pr-3 text-gray-700">{d.lead_name || d.customer_name || '—'}</td>
                    <td className="py-3 pr-3">
                      <select
                        value={d.pipeline_stage}
                        onChange={e => handleStageChange(d.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${STAGE_COLORS[d.pipeline_stage] || 'bg-gray-100 text-gray-700'}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label} ({s.probability}%)</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-3 text-right font-medium text-gray-800">{fmtKES(d.deal_value)}</td>
                    <td className="py-3 pr-3 text-right text-brand font-medium">{fmtKES(d.deal_value * (d.probability / 100))}</td>
                    <td className="py-3 pr-3 text-gray-500 text-xs">{daysInStage(d.created_at)}d</td>
                    <td className="py-3 pr-3 text-gray-700 text-xs">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        d.status === 'won' ? 'bg-green-100 text-green-700' :
                        d.status === 'lost' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Active'}</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDeals.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingUp className="h-8 w-8 mb-2" />
              <p className="text-sm">No deals match your filters</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">{editing ? 'Edit Deal' : 'Add Deal'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Deal Name" value={form.deal_name} onChange={set('deal_name')} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Lead *</label>
                  <select value={form.lead_id} onChange={e => {
                    const id = e.target.value;
                    const lead = leads.find(l => l.id === id);
                    set('lead_id')(id);
                    if (lead) {
                      set('contact_name')(lead.name || '');
                      set('contact_email')(lead.email || '');
                      set('contact_phone')(lead.phone || '');
                      if (!form.deal_name) set('deal_name')(`${lead.name} - Deal`);
                    }
                  }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    <option value="">Select lead</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.email ? ` (${l.email})` : ''}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Deals come from leads. Won deals become customers.</p>
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
                  <select value={form.pipeline_stage} onChange={e => {
                    const stage = getStage(e.target.value);
                    set('pipeline_stage')(e.target.value);
                    set('probability')(stage.probability);
                  }} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label} ({s.probability}%)</option>)}
                  </select>
                </div>
                <Field label="Probability (%)" value={String(form.probability)} onChange={v => set('probability')(Number(v) || 0)} type="number" />
              </div>
              <Field label="Expected Close Date" value={form.expected_close_date} onChange={set('expected_close_date')} type="date" />
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              {form.pipeline_stage === 'closed_lost' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Lost Reason</label>
                  <select value={form.lost_reason} onChange={e => set('lost_reason')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    <option value="">Select reason...</option>
                    <option value="budget">Budget too high</option>
                    <option value="timeline">Timeline mismatch</option>
                    <option value="competitor">Chose competitor</option>
                    <option value="feature">Missing features</option>
                    <option value="relationship">Relationship/trust</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.deal_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : (editing ? 'Update Deal' : 'Add Deal')}
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
