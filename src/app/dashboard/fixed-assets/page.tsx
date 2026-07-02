'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Building2, Search, Download, TrendingDown, Ban } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;
import { ASSET_TYPES, DEPRECIATION_METHODS } from '@/lib/currencies';

type FixedAsset = {
  id: string;
  asset_name: string;
  asset_type: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: string;
  accumulated_depreciation: number;
  book_value: number;
  status: string;
  notes: string;
  created_at: string;
};

const emptyForm = {
  asset_name: '',
  asset_type: '',
  purchase_date: new Date().toISOString().split('T')[0],
  purchase_cost: 0,
  salvage_value: 0,
  useful_life_years: 5,
  depreciation_method: 'straight-line',
  notes: '',
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchAssets = () => {
    setLoading(true);
    setError('');
    fetch('/api/fixed-assets')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load fixed assets'))
      .then(setAssets)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const filteredAssets = useMemo(() => {
    let list = [...assets];
    if (typeFilter) list = list.filter(a => a.asset_type === typeFilter);
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    if (dateFrom) list = list.filter(a => (a.purchase_date || '') >= dateFrom);
    if (dateTo) list = list.filter(a => (a.purchase_date || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(a =>
        (a.asset_name || '').toLowerCase().includes(q) ||
        (a.asset_type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [assets, dateFrom, dateTo, typeFilter, statusFilter, debouncedSearch]);

  const totalCost = useMemo(() => assets.reduce((s, a) => s + (a.purchase_cost || 0), 0), [assets]);
  const totalBookValue = useMemo(() => assets.reduce((s, a) => s + ((a.book_value ?? a.purchase_cost - a.accumulated_depreciation) || 0), 0), [assets]);
  const totalDepreciation = useMemo(() => assets.reduce((s, a) => s + (a.accumulated_depreciation || 0), 0), [assets]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: FixedAsset) => {
    setEditing(a);
    setForm({
      asset_name: a.asset_name,
      asset_type: a.asset_type,
      purchase_date: a.purchase_date?.split('T')[0] || '',
      purchase_cost: a.purchase_cost,
      salvage_value: a.salvage_value,
      useful_life_years: a.useful_life_years,
      depreciation_method: a.depreciation_method,
      notes: a.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/fixed-assets';
      const method = editing ? 'PUT' : 'POST';
      const payload = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save fixed asset');
      setShowModal(false);
      fetchAssets();
    } catch (e: any) {
      toast(e.message || 'Error saving fixed asset');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (asset: FixedAsset, action: 'depreciate' | 'dispose') => {
    try {
      const label = action === 'depreciate' ? 'depreciate' : 'dispose';
      if (!await confirm(`${action === 'depreciate' ? 'Apply depreciation' : 'Dispose of'} "${asset.asset_name}"?`)) return;
      const res = await fetch('/api/fixed-assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id, action }),
      });
      if (!res.ok) throw new Error(`Failed to ${label} asset`);
      fetchAssets();
    } catch (e: any) {
      toast(e.message || `Error performing ${action}`);
    }
  };

  const handleDelete = async (asset: FixedAsset) => {
    if (!await confirm(`Delete fixed asset "${asset.asset_name}"?`)) return;
    try {
      const res = await fetch('/api/fixed-assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchAssets();
    } catch (e: any) {
      toast(e.message || 'Error deleting fixed asset');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'asset_name', label: 'Asset Name' },
    { key: 'asset_type', label: 'Type' },
    { key: 'purchase_date', label: 'Purchase Date' },
    { key: 'purchase_cost', label: 'Cost (USD)' },
    { key: 'salvage_value', label: 'Salvage Value (USD)' },
    { key: 'accumulated_depreciation', label: 'Accum. Depr. (USD)' },
    { key: 'book_value', label: 'Book Value (USD)' },
    { key: 'status', label: 'Status' },
  ];

  const exportFileName = `fixed-assets-${new Date().toISOString().split('T')[0]}`;

  const statusBadge = (s: string) => {
    const cls = s === 'active' ? 'bg-green-100 text-green-700' :
               s === 'disposed' ? 'bg-red-100 text-red-700' :
               'bg-yellow-100 text-yellow-700';
    return (
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${cls}`}>
        {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load fixed assets</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchAssets} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Fixed Assets</h1>
            <p className="text-xs text-gray-500">Manage company fixed assets and depreciation</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-gray-800">{fmtUSD(totalCost)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Book Value</p>
          <p className="text-2xl font-bold text-gray-800">{fmtUSD(totalBookValue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Depreciation</p>
          <p className="text-2xl font-bold text-gray-800">{fmtUSD(totalDepreciation)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search assets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="disposed">Disposed</option>
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredAssets, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredAssets, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Fixed Assets', filteredAssets, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Fixed Assets', filteredAssets, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(dateFrom || dateTo || typeFilter || statusFilter || searchQuery) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading fixed assets...</span>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Building2 className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No fixed assets recorded yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Asset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Asset Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Purchase Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Cost</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Salvage Value</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Accum. Depr.</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Book Value</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssets.map((a, i) => {
                  const bv = a.book_value ?? (a.purchase_cost - a.accumulated_depreciation);
                  return (
                    <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-4 text-gray-400 w-8">{filteredAssets.length - i}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{a.asset_name}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">{a.asset_type}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString('en-US') : '—'}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(a.purchase_cost)}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{fmtUSD(a.salvage_value)}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{fmtUSD(a.accumulated_depreciation)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(bv)}</td>
                      <td className="py-3 pr-4">{statusBadge(a.status)}</td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {a.status === 'active' && (
                            <button onClick={() => handleAction(a, 'depreciate')} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Depreciate">
                              <TrendingDown className="h-4 w-4" />
                            </button>
                          )}
                          {a.status !== 'disposed' && (
                            <button onClick={() => handleAction(a, 'dispose')} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Dispose">
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Fixed Asset' : 'Add Fixed Asset'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Asset Name" value={form.asset_name} onChange={set('asset_name')} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Asset Type</label>
                  <select
                    value={form.asset_type}
                    onChange={e => set('asset_type')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select type</option>
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Purchase Date" value={form.purchase_date} onChange={set('purchase_date')} type="date" />
                <Field label="Purchase Cost (USD)" value={String(form.purchase_cost)} onChange={v => set('purchase_cost')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Salvage Value (USD)" value={String(form.salvage_value)} onChange={v => set('salvage_value')(Number(v) || 0)} type="number" />
                <Field label="Useful Life (Years)" value={String(form.useful_life_years)} onChange={v => set('useful_life_years')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Depreciation Method</label>
                  <select
                    value={form.depreciation_method}
                    onChange={e => set('depreciation_method')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {DEPRECIATION_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Notes" value={form.notes} onChange={set('notes')} />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.asset_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Asset' : 'Add Asset'
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
