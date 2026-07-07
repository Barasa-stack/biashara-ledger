'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Trash2, X, Banknote, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type CapitalTransaction = {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  description: string;
  reference: string;
  created_at: string;
};

const emptyForm = {
  type: 'CAPITAL_INJECTION',
  amount: 0,
  transaction_date: new Date().toISOString().split('T')[0],
  description: '',
  reference: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const TYPES = [
  { value: 'CAPITAL_INJECTION', label: 'Capital Contribution', icon: TrendingUp },
  { value: 'OWNER_WITHDRAWAL', label: 'Owner Withdrawal', icon: TrendingDown },
];

export default function CapitalTransactionsPage() {
  const [transactions, setTransactions] = useState<CapitalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchTransactions = () => {
    setLoading(true);
    setError('');
    fetch('/api/capital-transactions')
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
        (t.reference || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, debouncedSearch]);

  const totalInjections = transactions.filter(t => t.type === 'CAPITAL_INJECTION').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'OWNER_WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
  const netEquity = totalInjections - totalWithdrawals;

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/capital-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const handleDelete = async (t: CapitalTransaction) => {
    if (!await confirm(`Delete ${t.type === 'CAPITAL_INJECTION' ? 'contribution' : 'withdrawal'} of ${fmtKES(t.amount)}?`)) return;
    try {
      const res = await fetch('/api/capital-transactions', {
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

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Capital Transactions</h1>
          <p className="text-sm text-[#000000]">
            Contributions: <span className="text-red-600 font-medium">{fmtKES(totalInjections)}</span> &middot;
            Withdrawals: <span className="text-red-500 font-medium">{fmtKES(totalWithdrawals)}</span> &middot;
            Net: <span className={netEquity >= 0 ? 'text-red-600 font-medium' : 'text-red-500 font-medium'}>{fmtKES(netEquity)}</span>
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus className="h-4 w-4" /> Record Transaction
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
          <option value="">All</option>
          <option value="CAPITAL_INJECTION">Contributions</option>
          <option value="OWNER_WITHDRAWAL">Withdrawals</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-border">
          <Banknote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No capital transactions yet</p>
          <p className="text-sm mt-1">Record owner contributions or withdrawals to track equity changes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-[#000000] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Reference</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isInjection = t.type === 'CAPITAL_INJECTION';
                  const TypeIcon = isInjection ? TrendingUp : TrendingDown;
                  return (
                    <tr key={t.id} className="border-b border-border/50 text-[#000000]">
                      <td className="px-4 py-3 text-gray-500">{t.transaction_date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isInjection ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          <TypeIcon className="h-3 w-3" /> {isInjection ? 'Contribution' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[250px] truncate">{t.description || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{t.reference || '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isInjection ? 'text-red-600' : 'text-red-500'}`}>
                        {isInjection ? '' : '('}{fmtKES(t.amount)}{isInjection ? '' : ')'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(t)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
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
        const capColumns: { key: string; label: string }[] = [
          { key: 'transaction_date', label: 'Date' },
          { key: 'type_label', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'reference', label: 'Reference' },
          { key: 'amount', label: 'Amount' },
        ];
        const capData = filtered.map(r => ({ ...r, type_label: r.type === 'CAPITAL_INJECTION' ? 'Contribution' : 'Withdrawal', amount: fmtKES(r.amount) }));
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Export: </span>
            <button onClick={() => exportCSV(capData, capColumns, 'capital-transactions.csv')} className="text-xs text-brand hover:underline">CSV</button>
            <button onClick={() => exportExcel(capData, capColumns, 'capital-transactions.xlsx')} className="text-xs text-brand hover:underline">Excel</button>
            <button onClick={() => exportPDF('Capital Transactions', capData, capColumns, 'capital-transactions.pdf')} className="text-xs text-brand hover:underline">PDF</button>
            <button onClick={() => exportWord('Capital Transactions', capData, capColumns, 'capital-transactions.doc')} className="text-xs text-brand hover:underline">Word</button>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#000000]">Record Transaction</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
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
                <label className="block text-xs font-medium text-[#000000] mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Reference (optional)</label>
                <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSubmit} disabled={saving || !form.amount} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Record'}
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
