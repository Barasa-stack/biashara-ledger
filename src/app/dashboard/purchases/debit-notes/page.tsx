'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileX, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type DebitNote = {
  id: string;
  debit_note_number: string;
  purchase_invoice_id: string;
  client_id: string;
  client_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  reason: string;
  notes: string;
  issue_date: string;
  created_at: string;
};

type PurchaseInvoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  issue_date: string;
};

type Client = {
  id: string;
  supplier_name: string;
};

const emptyForm = {
  debit_note_number: '',
  purchase_invoice_id: '',
  client_id: '',
  client_name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  reason: '',
  notes: '',
  issue_date: new Date().toISOString().split('T')[0],
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function DebitNotesPage() {
  const [notes, setNotes] = useState<DebitNote[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DebitNote | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchNotes = () => {
    setLoading(true);
    setError('');
    fetch('/api/purchases/debit-notes')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load debit notes'))
      .then(setNotes)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchInvoices = () =>
    fetch('/api/purchases/invoices')
      .then(r => r.ok ? r.json() : [])
      .then(setInvoices)
      .catch(() => {});

  const fetchClients = () =>
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : [])
      .then(setClients)
      .catch(() => {});

  useEffect(() => { fetchNotes(); fetchInvoices(); fetchClients(); }, []);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (dateFrom) list = list.filter(n => (n.issue_date || '') >= dateFrom);
    if (dateTo) list = list.filter(n => (n.issue_date || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(n =>
        (n.debit_note_number || '').toLowerCase().includes(q) ||
        (n.client_name || '').toLowerCase().includes(q) ||
        (n.reason || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, dateFrom, dateTo, debouncedSearch]);

  const exportColumns = [
    { key: 'debit_note_number', label: 'Note#' },
    { key: 'client_name', label: 'Supplier' },
    { key: 'amount', label: 'Amount (KES)' },
    { key: 'reason', label: 'Reason' },
    { key: 'issue_date', label: 'Date' },
  ];

  const exportFileName = `debit-notes-${new Date().toISOString().split('T')[0]}`;

  const openAdd = () => {
    setEditing(null);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const prefix = `DN-${dd}/${mm}/${yyyy}-`;
    let maxSeq = 0;
    for (const n of notes) {
      if (n.debit_note_number && n.debit_note_number.startsWith(prefix)) {
        const seq = parseInt(n.debit_note_number.slice(prefix.length), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    const autoNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
    setForm({ ...emptyForm, debit_note_number: autoNumber });
    setShowModal(true);
  };

  const openEdit = (n: DebitNote) => {
    setEditing(n);
    setForm({
      debit_note_number: n.debit_note_number,
      purchase_invoice_id: n.purchase_invoice_id,
      client_id: n.client_id,
      client_name: n.client_name,
      description: n.description,
      quantity: n.quantity,
      unit_price: n.unit_price,
      amount: n.amount,
      reason: n.reason,
      notes: n.notes,
      issue_date: n.issue_date?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/purchases/debit-notes';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save debit note');
      setShowModal(false);
      fetchNotes();
    } catch (e: any) {
      toast(e.message || 'Error saving debit note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (n: DebitNote) => {
    if (!await confirm(`Delete debit note "${n.debit_note_number}"?`)) return;
    try {
      const res = await fetch('/api/purchases/debit-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchNotes();
    } catch (e: any) {
      toast(e.message || 'Error deleting debit note');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load debit notes</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchNotes} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <FileX className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Debit Notes</h1>
            <p className="text-xs text-gray-500">Manage debit notes from suppliers</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Debit Note
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by note#, supplier, or reason..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredNotes, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredNotes, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Debit Notes', filteredNotes, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Debit Notes', filteredNotes, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(dateFrom || dateTo || searchQuery) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading debit notes...</span>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <FileX className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No debit notes yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Debit Note
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Note#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Supplier</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reason</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotes.map((n, i) => (
                  <tr key={n.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredNotes.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{n.debit_note_number}</td>
                    <td className="py-3 pr-4 text-gray-700">{n.client_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(n.amount)}</td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate">{n.reason || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{n.issue_date ? new Date(n.issue_date).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(n)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(n)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Debit Note' : 'Add Debit Note'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Debit Note Number" value={form.debit_note_number} onChange={set('debit_note_number')} required readOnly />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Purchase Invoice</label>
                  <select
                    value={form.purchase_invoice_id}
                    onChange={e => {
                      const id = e.target.value;
                      const inv = invoices.find(i => i.id === id);
                      if (inv) {
                        setForm(p => ({ ...p, purchase_invoice_id: id, client_id: inv.client_id, client_name: inv.client_name, description: inv.description, quantity: inv.quantity, unit_price: inv.unit_price, amount: inv.amount, issue_date: inv.issue_date || p.issue_date }));
                      } else {
                        setForm(p => ({ ...p, purchase_invoice_id: id }));
                      }
                    }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select invoice</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.invoice_number} — {inv.client_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Supplier</label>
                  <select
                    value={form.client_id}
                    onChange={e => {
                      const id = e.target.value;
                      const c = clients.find(cl => cl.id === id);
                      setForm(p => ({ ...p, client_id: id, client_name: c?.supplier_name || '' }));
                    }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select supplier</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <Field label="Supplier Name" value={form.client_name} onChange={set('client_name')} />
              </div>
              <Field label="Reason" value={form.reason} onChange={set('reason')} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Quantity" value={String(form.quantity)} onChange={v => set('quantity')(Number(v) || 0)} type="number" />
                <Field label="Unit Price (KES)" value={String(form.unit_price)} onChange={v => set('unit_price')(Number(v) || 0)} type="number" />
                <Field label="Amount (KES)" value={String(form.amount)} onChange={v => set('amount')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Description" value={form.description} onChange={set('description')} />
                <Field label="Issue Date" value={form.issue_date} onChange={set('issue_date')} type="date" />
              </div>
              <Field label="Notes" value={form.notes} onChange={set('notes')} />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !(form.debit_note_number || '').trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Debit Note' : 'Add Debit Note'
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

function Field({ label, value, onChange, type, required, readOnly }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
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
        readOnly={readOnly}
        className={`w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${readOnly ? 'bg-gray-50 text-gray-500' : 'text-gray-800'}`}
      />
    </div>
  );
}