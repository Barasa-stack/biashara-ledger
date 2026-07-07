'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, ArrowRightLeft, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type OtherTransaction = {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  notes: string;
  created_at: string;
};

const emptyForm = {
  type: 'OTHER_INCOME',
  category: '',
  description: '',
  amount: 0,
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const TYPES = [
  { value: 'OTHER_INCOME', label: 'Other Income', icon: TrendingUp },
  { value: 'OTHER_EXPENSE', label: 'Other Expense', icon: TrendingDown },
];
const INCOME_CATEGORIES = ['Interest Income', 'Dividend Income', 'Rental Income', 'Commission', 'Foreign Exchange Gain', 'Grants', 'Donations', 'Miscellaneous Income', 'Other'];
const EXPENSE_CATEGORIES = ['Bank Charges', 'Late Fees', 'Penalties', 'Foreign Exchange Loss', 'Donations', 'Miscellaneous Expense', 'Other'];

export default function OtherTransactionsPage() {
  const [transactions, setTransactions] = useState<OtherTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OtherTransaction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchTransactions = () => {
    setLoading(true);
    setError('');
    fetch('/api/other-transactions')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then(setTransactions)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter) list = list.filter(t => t.type === typeFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, debouncedSearch]);

  const totalIncome = transactions.filter(t => t.type === 'OTHER_INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'OTHER_EXPENSE').reduce((s, t) => s + t.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: OtherTransaction) => {
    setEditing(t);
    setForm({
      type: t.type,
      category: t.category,
      description: t.description,
      amount: t.amount,
      transaction_date: t.transaction_date?.split('T')[0] || '',
      notes: t.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/other-transactions';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      setShowModal(false);
      fetchTransactions();
    } catch (e: any) {
      toast(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: OtherTransaction) => {
    if (!await confirm(`Delete ${t.type === 'OTHER_INCOME' ? 'income' : 'expense'} of ${fmtKES(t.amount)}?`)) return;
    try {
      const res = await fetch('/api/other-transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchTransactions();
    } catch (e: any) {
      toast(e.message || 'Error deleting');
    }
  };

  const categories = form.type === 'OTHER_INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Other Income &amp; Expenses</h1>
          <p className="text-sm text-[#000000]">
            Income: <span className="text-red-600 font-medium">{fmtKES(totalIncome)}</span> &middot;
            Expenses: <span className="text-red-500 font-medium">{fmtKES(totalExpenses)}</span>
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-[#000000] bg-white" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
          <option value="">All Types</option>
          <option value="OTHER_INCOME">Income</option>
          <option value="OTHER_EXPENSE">Expenses</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-border">
          <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No transactions yet</p>
          <p className="text-sm mt-1">Add non-operating income or expenses like interest, donations, or bank charges.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-[#000000] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isIncome = t.type === 'OTHER_INCOME';
                  const TypeIcon = isIncome ? TrendingUp : TrendingDown;
                  return (
                    <tr key={t.id} className="border-b border-border/50 text-[#000000]">
                      <td className="px-4 py-3 text-gray-500">{t.transaction_date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isIncome ? 'bg-red-50 text-red-700' : 'bg-red-50 text-red-700'}`}>
                          <TypeIcon className="h-3 w-3" /> {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{t.category || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{t.description || '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isIncome ? 'text-red-600' : 'text-red-500'}`}>
                        {isIncome ? '' : '('}{fmtKES(t.amount)}{isIncome ? '' : ')'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4 text-gray-500" /></button>
                          <button onClick={() => handleDelete(t)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const othColumns: { key: string; label: string }[] = [
          { key: 'transaction_date', label: 'Date' },
          { key: 'type_label', label: 'Type' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount' },
        ];
        const othData = filtered.map(r => ({ ...r, type_label: r.type === 'OTHER_INCOME' ? 'Income' : 'Expense', amount: fmtKES(r.amount) }));
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Export: </span>
            <button onClick={() => exportCSV(othData, othColumns, 'other-transactions.csv')} className="text-xs text-brand hover:underline">CSV</button>
            <button onClick={() => exportExcel(othData, othColumns, 'other-transactions.xlsx')} className="text-xs text-brand hover:underline">Excel</button>
            <button onClick={() => exportPDF('Other Transactions', othData, othColumns, 'other-transactions.pdf')} className="text-xs text-brand hover:underline">PDF</button>
            <button onClick={() => exportWord('Other Transactions', othData, othColumns, 'other-transactions.doc')} className="text-xs text-brand hover:underline">Word</button>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#000000]">{editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: '' })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Amount ($)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Date</label>
                  <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSubmit} disabled={saving || !form.amount} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Transaction'}
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
