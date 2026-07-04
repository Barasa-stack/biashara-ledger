'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, RotateCcw, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type RecurringTemplate = {
  id: string;
  template_name: string;
  entity_type: string;
  frequency: string;
  interval_count: number;
  template_data: string;
  next_run: string;
  last_run: string;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  template_name: '',
  entity_type: 'invoice',
  frequency: 'monthly',
  interval_count: 1,
  template_data: '',
};

const ENTITY_TYPES = ['invoice', 'expense', 'purchase'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US') : '—';

export default function RecurringPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchTemplates = () => {
    setLoading(true);
    setError('');
    fetch('/api/recurring-templates')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load recurring templates'))
      .then(setTemplates)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const filteredTemplates = useMemo(() => {
    let list = [...templates];
    if (typeFilter) list = list.filter(t => t.entity_type === typeFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(t =>
        (t.template_name || '').toLowerCase().includes(q) ||
        (t.entity_type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, typeFilter, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: RecurringTemplate) => {
    setEditing(t);
    setForm({
      template_name: t.template_name,
      entity_type: t.entity_type,
      frequency: t.frequency,
      interval_count: t.interval_count,
      template_data: t.template_data,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/recurring-templates';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save template');
      setShowModal(false);
      fetchTemplates();
    } catch (e: any) {
      toast(e.message || 'Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: RecurringTemplate) => {
    if (!await confirm(`Delete template "${t.template_name}"?`)) return;
    try {
      const res = await fetch('/api/recurring-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchTemplates();
    } catch (e: any) {
      toast(e.message || 'Error deleting template');
    }
  };

  const handleToggleActive = async (t: RecurringTemplate) => {
    try {
      const res = await fetch('/api/recurring-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, active: !t.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchTemplates();
    } catch (e: any) {
      toast(e.message || 'Error updating template');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'template_name', label: 'Template Name' },
    { key: 'entity_type', label: 'Entity Type' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'next_run', label: 'Next Run' },
    { key: 'last_run', label: 'Last Run' },
    { key: 'active', label: 'Active' },
  ];

  const exportFileName = `recurring-templates-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load recurring templates</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchTemplates} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <RotateCcw className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Recurring Templates</h1>
            <p className="text-xs text-gray-500">Automate recurring invoices, expenses and purchases</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Template
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Types</option>
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredTemplates, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredTemplates, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Recurring Templates', filteredTemplates, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Recurring Templates', filteredTemplates, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(typeFilter || searchQuery) && (
            <button onClick={() => { setTypeFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading templates...</span>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <RotateCcw className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No recurring templates yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Template Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Entity Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Frequency</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Next Run</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Last Run</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Active</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTemplates.map((t, i) => (
                  <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredTemplates.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{t.template_name}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                        {t.entity_type.charAt(0).toUpperCase() + t.entity_type.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {t.interval_count > 1 ? `${t.interval_count} ${t.frequency}s` : t.frequency}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(t.next_run)}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(t.last_run)}</td>
                    <td className="py-3 pr-4 text-center">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                          t.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Template' : 'Add Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <Field label="Template Name" value={form.template_name} onChange={set('template_name')} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Entity Type</label>
                  <select
                    value={form.entity_type}
                    onChange={e => set('entity_type')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => set('frequency')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Interval Count" value={String(form.interval_count)} onChange={v => set('interval_count')(Number(v) || 1)} type="number" />
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Template Data (JSON)</label>
                <textarea
                  value={form.template_data}
                  onChange={e => set('template_data')(e.target.value)}
                  rows={6}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  placeholder='{"description": "Monthly rent", "amount": 1500}'
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.template_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Template' : 'Add Template'
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
