'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Receipt, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type Expense = {
  id: string;
  expense_code: string;
  category: string;
  description: string;
  supplier_vendor: string;
  invoice_receipt_number: string;
  amount: number;
  tax_vat: number;
  expense_date: string;
  payment_method: string;
  paid_by: string;
  status: string;
  notes: string;
  created_at: string;
};

const emptyForm = {
  expense_code: '',
  category: '',
  description: '',
  supplier_vendor: '',
  invoice_receipt_number: '',
  amount: 0,
  tax_vat: 0,
  expense_date: new Date().toISOString().split('T')[0],
  payment_method: 'Cash',
  paid_by: '',
  status: 'pending',
  notes: '',
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const CATEGORIES = ['Office Supplies', 'Utilities', 'Travel', 'Meals', 'Equipment', 'Rent', 'Transport', 'Maintenance', 'Software', 'Training', 'Marketing', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Card'];
const STATUSES = ['pending', 'approved', 'rejected'];

export default function ExpensesPage() {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchExpenses = () => {
    setLoading(true);
    setError('');
    fetch('/api/expenses')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load expenses'))
      .then(setExpenses)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, []);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (statusFilter) list = list.filter(e => e.status === statusFilter);
    if (categoryFilter) list = list.filter(e => e.category === categoryFilter);
    if (dateFrom) list = list.filter(e => (e.expense_date || '') >= dateFrom);
    if (dateTo) list = list.filter(e => (e.expense_date || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(e =>
        (e.expense_code || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.supplier_vendor || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [expenses, dateFrom, dateTo, statusFilter, categoryFilter, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      expense_code: e.expense_code,
      category: e.category,
      description: e.description,
      supplier_vendor: e.supplier_vendor,
      invoice_receipt_number: e.invoice_receipt_number,
      amount: e.amount,
      tax_vat: e.tax_vat,
      expense_date: e.expense_date?.split('T')[0] || '',
      payment_method: e.payment_method,
      paid_by: e.paid_by,
      status: e.status,
      notes: e.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/expenses';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save expense');
      setShowModal(false);
      fetchExpenses();
    } catch (e: any) {
      toast(e.message || 'Error saving expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    const ok = await confirm(`Delete expense "${exp.expense_code}"?`);
    if (!ok) return;
    const prev = expenses;
    setExpenses(prev => prev.filter(e => e.id !== exp.id));
    try {
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exp.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast('Expense deleted', 'success');
    } catch (e: any) {
      setExpenses(prev);
      toast(e.message || 'Error deleting expense');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'expense_code', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount (USD)' },
    { key: 'expense_date', label: 'Date' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'status', label: 'Status' },
  ];

  const exportFileName = `expenses-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load expenses</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchExpenses} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Receipt className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Expenses</h1>
            <p className="text-xs text-gray-500">Track and manage business expenses</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredExpenses, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredExpenses, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Expenses', filteredExpenses, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Expenses', filteredExpenses, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(dateFrom || dateTo || statusFilter || categoryFilter || searchQuery) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setCategoryFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading expenses...</span>
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Receipt className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No expenses recorded yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Code</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Category</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Description</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.map((exp, i) => (
                  <tr key={exp.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredExpenses.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{exp.expense_code}</td>
                    <td className="py-3 pr-4">
                      {exp.category ? (
                        <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">{exp.category}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate">{exp.description || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(exp.amount)}</td>
                    <td className="py-3 pr-4 text-gray-700">{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        exp.status === 'approved' ? 'bg-red-100 text-red-700' :
                        exp.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {exp.status ? exp.status.charAt(0).toUpperCase() + exp.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(exp)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(exp)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expense Code" value={form.expense_code} onChange={set('expense_code')} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => set('category')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Supplier/Vendor" value={form.supplier_vendor} onChange={set('supplier_vendor')} />
                <Field label="Invoice/Receipt #" value={form.invoice_receipt_number} onChange={set('invoice_receipt_number')} />
              </div>
              <Field label="Description" value={form.description} onChange={set('description')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Amount (USD)" value={String(form.amount)} onChange={v => set('amount')(Number(v) || 0)} type="number" />
                <Field label="Tax/VAT (USD)" value={String(form.tax_vat)} onChange={v => set('tax_vat')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expense Date" value={form.expense_date} onChange={set('expense_date')} type="date" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={e => set('payment_method')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Paid By" value={form.paid_by} onChange={set('paid_by')} />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
                disabled={saving || !form.expense_code.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Expense' : 'Add Expense'
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
