'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, PenTool, Search, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;

type Account = {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
};

type JournalLine = {
  account_id: string;
  account_name?: string;
  account_code?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
};

type JournalEntry = {
  id: string;
  entry_number: string;
  description: string;
  entry_date: string;
  reference: string;
  status: string;
  total_debit: number;
  total_credit: number;
  created_at: string;
};

type JournalEntryDetail = {
  entry: JournalEntry;
  lines: (JournalLine & { id: string; account_name: string; account_code: string; account_type: string })[];
};

const emptyLine = (): JournalLine => ({
  account_id: '',
  description: '',
  debit_amount: 0,
  credit_amount: 0,
});

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<JournalEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [formEntryNumber, setFormEntryNumber] = useState('');
  const [formEntryDate, setFormEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formLines, setFormLines] = useState<JournalLine[]>([emptyLine()]);

  const totalDebit = useMemo(() => formLines.reduce((s, l) => s + (Number(l.debit_amount) || 0), 0), [formLines]);
  const totalCredit = useMemo(() => formLines.reduce((s, l) => s + (Number(l.credit_amount) || 0), 0), [formLines]);
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

  const fetchEntries = () => {
    setLoading(true);
    setError('');
    fetch('/api/journal-entries')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load journal entries'))
      .then(setEntries)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchAccounts = () => {
    fetch('/api/chart-of-accounts')
      .then(r => r.ok ? r.json() : [])
      .then(setAccounts)
      .catch(() => {});
  };

  useEffect(() => { fetchEntries(); fetchAccounts(); }, []);

  const filteredEntries = useMemo(() => {
    let list = [...entries];
    if (statusFilter) list = list.filter(e => e.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(e =>
        (e.entry_number || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.reference || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, statusFilter, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setFormEntryNumber('');
    setFormEntryDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormReference('');
    setFormLines([emptyLine()]);
    setShowModal(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditing(entry);
    setFormEntryNumber(entry.entry_number);
    setFormEntryDate(entry.entry_date?.split('T')[0] || '');
    setFormDescription(entry.description);
    setFormReference(entry.reference || '');

    fetch(`/api/journal-entries/${entry.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.lines) {
          setFormLines(data.lines.map((l: any) => ({
            account_id: l.account_id,
            description: l.description || '',
            debit_amount: Number(l.debit_amount) || 0,
            credit_amount: Number(l.credit_amount) || 0,
          })));
        }
      })
      .catch(() => {});
    setShowModal(true);
  };

  const addLine = () => setFormLines(prev => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (formLines.length <= 1) return;
    setFormLines(prev => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    setFormLines(prev => prev.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/journal-entries';
      const method = editing ? 'PUT' : 'POST';
      const body = {
        ...(editing ? { id: editing.id } : {}),
        entry_number: formEntryNumber,
        description: formDescription,
        entry_date: formEntryDate,
        reference: formReference,
        status: editing?.status || 'draft',
        lines: formLines.map(l => ({
          account_id: l.account_id,
          description: l.description,
          debit_amount: Number(l.debit_amount) || 0,
          credit_amount: Number(l.credit_amount) || 0,
        })),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save journal entry');
      }
      setShowModal(false);
      fetchEntries();
    } catch (e: any) {
      toast(e.message || 'Error saving journal entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!await confirm(`Delete journal entry "${entry.entry_number}"?`)) return;
    try {
      const res = await fetch('/api/journal-entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDetailEntry(null);
      fetchEntries();
    } catch (e: any) {
      toast(e.message || 'Error deleting journal entry');
    }
  };

  const handlePost = async (entry: JournalEntry) => {
    if (!await confirm(`Post journal entry "${entry.entry_number}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch('/api/journal-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, status: 'posted' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to post journal entry');
      }
      setDetailEntry(null);
      fetchEntries();
    } catch (e: any) {
      toast(e.message || 'Error posting journal entry');
    }
  };

  const openDetail = (entry: JournalEntry) => {
    setDetailLoading(true);
    setDetailEntry(null);
    fetch(`/api/journal-entries/${entry.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setDetailEntry(data))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const exportColumns = [
    { key: 'entry_number', label: 'Entry #' },
    { key: 'entry_date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'reference', label: 'Reference' },
    { key: 'total_debit', label: 'Total Debit (USD)' },
    { key: 'total_credit', label: 'Total Credit (USD)' },
    { key: 'status', label: 'Status' },
  ];

  const exportFileName = `journal-entries-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load journal entries</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchEntries} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <PenTool className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Journal Entries</h1>
            <p className="text-xs text-gray-500">Double-entry journal entry system</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredEntries, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredEntries, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Journal Entries', filteredEntries, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Journal Entries', filteredEntries, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(statusFilter || searchQuery) && (
            <button onClick={() => { setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading journal entries...</span>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <PenTool className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No journal entries recorded yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Create Your First Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Entry #</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Description</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reference</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Total Debit</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Total Credit</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(entry)}
                  >
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredEntries.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{entry.entry_number || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate">{entry.description || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{entry.reference || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(entry.total_debit)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(entry.total_credit)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        entry.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {entry.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(entry)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
          <div className="bg-white rounded-lg border border-border w-full max-w-4xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Entry #</label>
                  <input
                    type="text"
                    value={formEntryNumber}
                    onChange={e => setFormEntryNumber(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="JE-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Entry Date</label>
                  <input
                    type="date"
                    value={formEntryDate}
                    onChange={e => setFormEntryDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Reference</label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={e => setFormReference(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Optional reference"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Brief description of the journal entry"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Journal Lines</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-gray-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Line
                  </button>
                </div>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface/50 border-b border-border">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 min-w-[180px]">Account</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 min-w-[150px]">Description</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 min-w-[120px]">Debit</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 min-w-[120px]">Credit</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formLines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <select
                              value={line.account_id}
                              onChange={e => updateLine(index, 'account_id', e.target.value)}
                              className="w-full border border-border rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                            >
                              <option value="">Select account</option>
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.account_code} - {acc.account_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={e => updateLine(index, 'description', e.target.value)}
                              className="w-full border border-border rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                              placeholder="Line description"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.debit_amount || ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                updateLine(index, 'debit_amount', val);
                              }}
                              className="w-full border border-border rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.credit_amount || ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                updateLine(index, 'credit_amount', val);
                              }}
                              className="w-full border border-border rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {formLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLine(index)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove line"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface/50 border-t border-border font-medium">
                        <td colSpan={2} className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Totals</td>
                        <td className="px-3 py-2 text-right text-sm text-gray-800">{fmtUSD(totalDebit)}</td>
                        <td className="px-3 py-2 text-right text-sm text-gray-800">{fmtUSD(totalCredit)}</td>
                        <td></td>
                      </tr>
                      <tr className="bg-surface/50 border-t border-border">
                        <td colSpan={5} className="px-3 py-2">
                          <div className="flex items-center gap-2 text-xs">
                            {isBalanced ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Balanced ({fmtUSD(totalDebit)} = {fmtUSD(totalCredit)})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Not balanced — Difference: {fmtUSD(Math.abs(totalDebit - totalCredit))}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !isBalanced || !formEntryDate || !formEntryNumber.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Entry' : 'Save Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-3xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                Journal Entry — {detailEntry.entry.entry_number || 'Untitled'}
              </h2>
              <button onClick={() => setDetailEntry(null)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Entry #</p>
                  <p className="text-sm font-medium text-gray-800">{detailEntry.entry.entry_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm text-gray-800">{detailEntry.entry.entry_date ? new Date(detailEntry.entry.entry_date).toLocaleDateString('en-US') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Reference</p>
                  <p className="text-sm text-gray-800">{detailEntry.entry.reference || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                    detailEntry.entry.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {detailEntry.entry.status ? detailEntry.entry.status.charAt(0).toUpperCase() + detailEntry.entry.status.slice(1) : 'Draft'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-800">{detailEntry.entry.description || '—'}</p>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface/50 border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Account</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Description</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Debit</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detailEntry.lines.map((line, i) => (
                      <tr key={line.id || i}>
                        <td className="px-3 py-2 text-gray-800 font-medium">
                          {line.account_code ? `${line.account_code} - ${line.account_name}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{line.description || '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{Number(line.debit_amount) > 0 ? fmtUSD(line.debit_amount) : '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{Number(line.credit_amount) > 0 ? fmtUSD(line.credit_amount) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface/50 border-t border-border font-medium">
                      <td colSpan={2} className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Totals</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-800">{fmtUSD(detailEntry.lines.reduce((s, l) => s + Number(l.debit_amount), 0))}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-800">{fmtUSD(detailEntry.lines.reduce((s, l) => s + Number(l.credit_amount), 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
              <div>
                {detailEntry.entry.status === 'draft' && (
                  <button
                    onClick={() => handleDelete(detailEntry.entry)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setDetailEntry(null)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                  Close
                </button>
                {detailEntry.entry.status === 'draft' && (
                  <button
                    onClick={() => handlePost(detailEntry.entry)}
                    className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Post Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading entry details...</span>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
