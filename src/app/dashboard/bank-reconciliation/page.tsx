'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, X, Landmark, Search, Download, RefreshCw } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;
import { formatCurrency } from '@/lib/currencies';

type BankAccount = {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  opening_balance: number;
  active: boolean;
};

type Reconciliation = {
  id: string;
  bank_account_id: string;
  period: string;
  statement_balance: number;
  system_balance: number;
  difference: number;
  matched_count: number;
  unmatched_count: number;
  status: string;
  created_at: string;
};

const emptyForm = {
  bank_account_id: '',
  period: new Date().toISOString().slice(0, 7),
  statement_balance: 0,
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const accountMap = useMemo(() => {
    const m = new Map<string, BankAccount>();
    accounts.forEach(a => m.set(a.id, a));
    return m;
  }, [accounts]);

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/bank-accounts').then(r => r.ok ? r.json() : Promise.reject('Failed to load bank accounts')),
      fetch('/api/reconciliations').then(r => r.ok ? r.json() : Promise.reject('Failed to load reconciliations')),
    ])
      .then(([accts, recs]) => {
        setAccounts(accts);
        setReconciliations(recs);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredReconciliations = useMemo(() => {
    let list = [...reconciliations];
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(r => {
        const acc = accountMap.get(r.bank_account_id);
        return (acc?.account_name || '').toLowerCase().includes(q) ||
               (acc?.bank_name || '').toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reconciliations, accountMap, statusFilter, debouncedSearch]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to start reconciliation');
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast(e.message || 'Error starting reconciliation');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'account', label: 'Account' },
    { key: 'period', label: 'Period' },
    { key: 'statement_balance', label: 'Statement Balance' },
    { key: 'system_balance', label: 'System Balance' },
    { key: 'difference', label: 'Difference' },
    { key: 'matched_count', label: 'Matched' },
    { key: 'unmatched_count', label: 'Unmatched' },
    { key: 'status', label: 'Status' },
  ];

  const exportFileName = `reconciliation-${new Date().toISOString().split('T')[0]}`;

  const exportData = filteredReconciliations.map(r => {
    const acc = accountMap.get(r.bank_account_id);
    return {
      account: acc?.account_name || '—',
      period: r.period,
      statement_balance: fmtUSD(r.statement_balance),
      system_balance: fmtUSD(r.system_balance),
      difference: fmtUSD(r.difference),
      matched_count: r.matched_count,
      unmatched_count: r.unmatched_count,
      status: r.status,
    };
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load reconciliation data</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchData} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <h1 className="text-lg font-semibold text-gray-800">Bank Reconciliation</h1>
            <p className="text-xs text-gray-500">Match bank statements against system records</p>
          </div>
        </div>
        <button onClick={openAdd} disabled={accounts.length === 0} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <Plus className="h-4 w-4" />
          New Reconciliation
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Bank Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.filter(a => a.active).map(a => (
              <div key={a.id} className="border border-border rounded-lg p-3 hover:bg-surface/50 transition-colors">
                <p className="text-sm font-medium text-gray-800">{a.account_name}</p>
                <p className="text-xs text-gray-500">{a.bank_name} &middot; {a.account_number}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Currency: <span className="font-medium text-brand">{a.currency}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search reconciliations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(exportData, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(exportData, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Bank Reconciliation', exportData, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Bank Reconciliation', exportData, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(statusFilter || searchQuery) && (
            <button onClick={() => { setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Reconciliation Runs</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading reconciliations...</span>
            </div>
          </div>
        ) : filteredReconciliations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <RefreshCw className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No reconciliation runs yet</p>
            <button onClick={openAdd} disabled={accounts.length === 0} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
              <Plus className="h-4 w-4" />
              Start Reconciliation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Account</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Period</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Statement Balance</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">System Balance</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Difference</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Matched</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Unmatched</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReconciliations.map((r, i) => {
                  const acc = accountMap.get(r.bank_account_id);
                  return (
                    <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-4 text-gray-400 w-8">{filteredReconciliations.length - i}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{acc?.account_name || '—'}</td>
                      <td className="py-3 pr-4 text-gray-700">{r.period}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(r.statement_balance)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(r.system_balance)}</td>
                      <td className={`py-3 pr-4 text-right font-medium ${r.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtUSD(r.difference)}
                      </td>
                      <td className="py-3 pr-4 text-center text-gray-700">{r.matched_count}</td>
                      <td className="py-3 pr-4 text-center text-gray-700">{r.unmatched_count}</td>
                      <td className="py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                          r.status === 'completed' ? 'bg-green-100 text-green-700' :
                          r.status === 'failed' ? 'bg-red-100 text-red-700' :
                          r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {r.status ? r.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pending'}
                        </span>
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
                New Reconciliation
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bank Account</label>
                <select
                  value={form.bank_account_id}
                  onChange={e => set('bank_account_id')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="">Select account</option>
                  {accounts.filter(a => a.active).map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} - {a.bank_name} ({a.currency})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Period (YYYY-MM)" value={form.period} onChange={set('period')} />
                <Field label="Statement Balance" value={String(form.statement_balance)} onChange={v => set('statement_balance')(Number(v) || 0)} type="number" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.bank_account_id || !form.period}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Reconciliation'
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
