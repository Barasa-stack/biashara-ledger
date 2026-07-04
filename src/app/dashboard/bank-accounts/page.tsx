'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Landmark, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { currencies } from '@/lib/currencies';

type BankAccount = {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  opening_balance: number;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  account_name: '',
  bank_name: '',
  account_number: '',
  currency: 'USD',
  opening_balance: 0,
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchAccounts = () => {
    setLoading(true);
    setError('');
    fetch('/api/bank-accounts')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load bank accounts'))
      .then(setAccounts)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filteredAccounts = useMemo(() => {
    let list = [...accounts];
    if (activeFilter === 'active') list = list.filter(a => a.active);
    if (activeFilter === 'inactive') list = list.filter(a => !a.active);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(a =>
        (a.account_name || '').toLowerCase().includes(q) ||
        (a.bank_name || '').toLowerCase().includes(q) ||
        (a.account_number || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [accounts, activeFilter, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: BankAccount) => {
    setEditing(a);
    setForm({
      account_name: a.account_name,
      bank_name: a.bank_name,
      account_number: a.account_number,
      currency: a.currency,
      opening_balance: a.opening_balance,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/bank-accounts';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save bank account');
      setShowModal(false);
      fetchAccounts();
    } catch (e: any) {
      toast(e.message || 'Error saving bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: BankAccount) => {
    if (!await confirm(`Delete bank account "${a.account_name}"?`)) return;
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchAccounts();
    } catch (e: any) {
      toast(e.message || 'Error deleting bank account');
    }
  };

  const handleToggleActive = async (a: BankAccount) => {
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, active: !a.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchAccounts();
    } catch (e: any) {
      toast(e.message || 'Error updating bank account');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'account_name', label: 'Account Name' },
    { key: 'bank_name', label: 'Bank' },
    { key: 'account_number', label: 'Account Number' },
    { key: 'currency', label: 'Currency' },
    { key: 'opening_balance', label: 'Opening Balance' },
    { key: 'active', label: 'Active' },
  ];

  const exportFileName = `bank-accounts-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load bank accounts</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchAccounts} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Landmark className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Bank Accounts</h1>
            <p className="text-xs text-gray-500">Manage your business bank accounts</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredAccounts, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredAccounts, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Bank Accounts', filteredAccounts, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Bank Accounts', filteredAccounts, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(activeFilter || searchQuery) && (
            <button onClick={() => { setActiveFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading bank accounts...</span>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Landmark className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No bank accounts yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Bank Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Account Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Bank</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Account Number</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Currency</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Opening Balance</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Active</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.map((a, i) => (
                  <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredAccounts.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{a.account_name}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.bank_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.account_number || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">{a.currency}</span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(a.opening_balance)}</td>
                    <td className="py-3 pr-4 text-center">
                      <button
                        onClick={() => handleToggleActive(a)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                          a.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {a.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Bank Account' : 'Add Bank Account'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Account Name" value={form.account_name} onChange={set('account_name')} required />
                <Field label="Bank Name" value={form.bank_name} onChange={set('bank_name')} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Account Number" value={form.account_number} onChange={set('account_number')} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => set('currency')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>)}
                  </select>
                </div>
              </div>
              <Field label="Opening Balance" value={String(form.opening_balance)} onChange={v => set('opening_balance')(Number(v) || 0)} type="number" />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.account_name.trim() || !form.bank_name.trim() || !form.account_number.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Bank Account' : 'Add Bank Account'
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
