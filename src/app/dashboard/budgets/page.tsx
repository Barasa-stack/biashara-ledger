'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Target, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type Budget = {
  id: string;
  fiscal_year: number;
  period: string;
  category_type: string;
  category_name: string;
  amount: number;
  created_at: string;
};

const emptyForm = {
  fiscal_year: new Date().getFullYear(),
  period: 'MONTHLY',
  category_type: 'REVENUE',
  category_name: '',
  amount: 0,
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const PERIODS = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];
const CATEGORY_TYPES = [
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'PURCHASES', label: 'Purchases' },
  { value: 'EXPENSES', label: 'Expenses' },
  { value: 'SALARIES', label: 'Salaries' },
  { value: 'OTHER_INCOME', label: 'Other Income' },
  { value: 'OTHER_EXPENSE', label: 'Other Expense' },
  { value: 'CAPITAL_INJECTION', label: 'Capital Injection' },
  { value: 'OWNER_WITHDRAWAL', label: 'Owner Withdrawal' },
  { value: 'INCOME_TAX', label: 'Income Tax' },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchBudgets = () => {
    setLoading(true);
    setError('');
    fetch('/api/budgets')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load budgets'))
      .then(setBudgets)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBudgets(); }, []);

  const filtered = useMemo(() => {
    let list = [...budgets];
    if (yearFilter) list = list.filter(b => String(b.fiscal_year) === yearFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(b =>
        (b.category_type || '').toLowerCase().includes(q) ||
        (b.category_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [budgets, yearFilter, debouncedSearch]);

  const years = [...new Set(budgets.map(b => b.fiscal_year))].sort((a, b) => b - a);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({
      fiscal_year: b.fiscal_year,
      period: b.period,
      category_type: b.category_type,
      category_name: b.category_name,
      amount: b.amount,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/budgets';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save budget');
      setShowModal(false);
      fetchBudgets();
    } catch (e: any) {
      toast(e.message || 'Error saving budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Budget) => {
    if (!await confirm(`Delete budget line "${b.category_name || b.category_type}" for ${b.fiscal_year}?`)) return;
    try {
      const res = await fetch('/api/budgets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchBudgets();
    } catch (e: any) {
      toast(e.message || 'Error deleting');
    }
  };

  const totalBudget = filtered.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Budgets</h1>
          <p className="text-sm text-[#000000]">{filtered.length} line items &middot; {fmtUSD(totalBudget)} total budget</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Budget Line
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-[#000000] bg-white" />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
          <option value="">All Years</option>
          {[...new Set([...years, new Date().getFullYear()])].sort((a, b) => b - a).map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-border">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No budgets defined</p>
          <p className="text-sm mt-1">Create budget lines to track performance against targets in reports.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-[#000000] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">Fiscal Year</th>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-left px-4 py-3 font-medium">Category Type</th>
                  <th className="text-left px-4 py-3 font-medium">Category Name</th>
                  <th className="text-right px-4 py-3 font-medium">Budget Amount</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 text-[#000000]">
                    <td className="px-4 py-3 font-medium">{b.fiscal_year}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-brand/10 text-brand">{b.period}</span>
                    </td>
                    <td className="px-4 py-3">{CATEGORY_TYPES.find(c => c.value === b.category_type)?.label || b.category_type}</td>
                    <td className="px-4 py-3 text-gray-500">{b.category_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtUSD(b.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4 text-gray-500" /></button>
                        <button onClick={() => handleDelete(b)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const budgetColumns: { key: string; label: string }[] = [
          { key: 'fiscal_year', label: 'Fiscal Year' },
          { key: 'period', label: 'Period' },
          { key: 'category_type', label: 'Category Type' },
          { key: 'category_name', label: 'Category Name' },
          { key: 'amount', label: 'Budget Amount' },
        ];
        const budgetData = filtered.map(r => ({ ...r, amount: fmtUSD(r.amount) }));
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Export: </span>
            <button onClick={() => exportCSV(budgetData, budgetColumns, 'budgets.csv')} className="text-xs text-brand hover:underline">CSV</button>
            <button onClick={() => exportExcel(budgetData, budgetColumns, 'budgets.xlsx')} className="text-xs text-brand hover:underline">Excel</button>
            <button onClick={() => exportPDF('Budgets', budgetData, budgetColumns, 'budgets.pdf')} className="text-xs text-brand hover:underline">PDF</button>
            <button onClick={() => exportWord('Budgets', budgetData, budgetColumns, 'budgets.doc')} className="text-xs text-brand hover:underline">Word</button>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#000000]">{editing ? 'Edit Budget Line' : 'Add Budget Line'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Fiscal Year</label>
                  <input type="number" value={form.fiscal_year} onChange={e => setForm({ ...form, fiscal_year: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Period</label>
                  <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Category Type</label>
                <select value={form.category_type} onChange={e => setForm({ ...form, category_type: e.target.value, category_name: '' })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                  {CATEGORY_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Category Name (optional)</label>
                <input value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} placeholder="e.g. Office Supplies, Marketing"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Budget Amount ($)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSubmit} disabled={saving || !form.amount} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update Budget' : 'Add Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
