'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileText, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';

type Invoice = {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  description: string;
  amount: number;
  payment_terms: string;
  issue_date: string;
};

type Customer = {
  id: number;
  customer_name: string;
  email_address: string;
};

type CreditNote = {
  id: number;
  credit_note_number: string;
  invoice_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  description: string;
  amount: number;
  reason: string;
  payment_terms: string;
  issue_date: string;
};

const emptyForm = {
  credit_note_number: '', invoice_id: 0, customer_id: 0, customer_name: '',
  customer_email: '', description: '', amount: 0, reason: '',
  payment_terms: '', issue_date: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

export default function CreditNotesPage() {
  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditNote | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchNotes = () => {
    setLoading(true);
    setError('');
    fetch('/api/sales/credit-notes')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load credit notes'))
      .then(setNotes)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchInvoicesAndCustomers = () => {
    return Promise.all([
      fetch('/api/sales/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/sales/customers').then(r => r.ok ? r.json() : []),
    ]);
  };

  useEffect(() => {
    fetchNotes();
    fetchInvoicesAndCustomers().then(([inv, cust]) => {
      setInvoices(inv);
      setCustomers(cust);
    });
  }, []);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (dateFrom) list = list.filter(n => (n.issue_date || '') >= dateFrom);
    if (dateTo) list = list.filter(n => (n.issue_date || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(n => (n.customer_name || '').toLowerCase().includes(q) || (n.credit_note_number || '').toLowerCase().includes(q) || (n.reason || '').toLowerCase().includes(q));
    }
    return list;
  }, [notes, dateFrom, dateTo, debouncedSearch]);

  const exportColumns = [
    { key: 'id', label: 'Note ID' },
    { key: 'credit_note_number', label: 'Credit Note #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'amount', label: 'Amount (KES)' },
    { key: 'reason', label: 'Reason' },
    { key: 'issue_date', label: 'Issue Date' },
  ];

  const exportFileName = `credit-notes-${new Date().toISOString().split('T')[0]}`;

  const openAdd = async () => {
    setEditing(null);
    setForm(emptyForm);
    try {
      const res = await fetch('/api/company/next-number?type=credit_note');
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, credit_note_number: data.number || '' }));
      }
    } catch {
      // proceed without auto-number
    }
    setModalOpen(true);
  };

  const openEdit = (n: CreditNote) => {
    setEditing(n);
    setForm({
      credit_note_number: n.credit_note_number,
      invoice_id: n.invoice_id,
      customer_id: n.customer_id,
      customer_name: n.customer_name,
      customer_email: n.customer_email || '',
      description: n.description || '',
      amount: n.amount,
      reason: n.reason || '',
      payment_terms: n.payment_terms || '',
      issue_date: n.issue_date?.split('T')[0] || '',
    });
    setModalOpen(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = field === 'amount' ? Number(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invoiceId = Number(e.target.value);
    if (!invoiceId) {
      setForm(prev => ({ ...prev, invoice_id: 0, customer_id: 0, customer_name: '', customer_email: '', description: '', amount: 0, payment_terms: '', issue_date: '' }));
      return;
    }
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const customer = customers.find(c => c.id === invoice.customer_id);
      setForm(prev => ({
        ...prev,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        customer_email: customer?.email_address || '',
        description: invoice.description || '',
        amount: invoice.amount,
        payment_terms: invoice.payment_terms || '',
        issue_date: invoice.issue_date?.split('T')[0] || '',
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/sales/credit-notes';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setModalOpen(false);
      fetchNotes();
    } catch (e: any) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (n: CreditNote) => {
    if (!confirm(`Delete credit note "${n.credit_note_number}"?`)) return;
    try {
      const res = await fetch('/api/sales/credit-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchNotes();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load credit notes</p>
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
            <FileText className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Credit Notes</h1>
            <p className="text-xs text-gray-500">Manage credit notes and refunds</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Credit Note
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
      <Search className="h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search by customer, note #, or reason..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full"
      />
    </div>
    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
    <span className="text-xs text-gray-400">to</span>
    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
    <div className="relative group">
      <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
        <Download className="h-4 w-4" />
        Export
      </button>
      <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
        <button onClick={() => exportCSV(filteredNotes, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
        <button onClick={() => exportExcel(filteredNotes, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
        <button onClick={() => exportPDF('Credit Notes', filteredNotes, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
        <button onClick={() => exportWord('Credit Notes', filteredNotes, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
      </div>
    </div>
    {(dateFrom || dateTo || searchQuery) && (
      <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">
        Clear filters
      </button>
    )}
  </div>
</div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading credit notes...</span>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">{notes.length === 0 ? 'No credit notes yet' : 'No credit notes match your filters'}</p>
            <p className="text-xs text-gray-400 mb-4">{notes.length === 0 ? 'Create your first credit note' : 'Try adjusting your search or filters'}</p>
            {notes.length === 0 ? (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Credit Note
              </button>
            ) : (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }} className="text-sm text-brand font-medium hover:text-gray-800">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Note#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reason</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Issue Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotes.map((n, i) => (
                  <tr key={n.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredNotes.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{n.credit_note_number}</td>
                    <td className="py-3 pr-4 text-gray-700">{n.customer_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(n.amount)}</td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate">{n.reason || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{n.issue_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(n)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(n)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Delete"
                        >
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-800">
                {editing ? 'Edit Credit Note' : 'New Credit Note'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Credit Note Number" value={form.credit_note_number} onChange={set('credit_note_number')} required readOnly />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Select Invoice
                  </label>
                  <select
                    value={form.invoice_id || ''}
                    onChange={handleInvoiceSelect}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">— Select Invoice —</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} — {inv.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Customer Name" value={form.customer_name} onChange={set('customer_name')} required />
                <Field label="Customer Email" value={form.customer_email} onChange={set('customer_email')} />
                <Field label="Issue Date" value={form.issue_date} onChange={set('issue_date')} type="date" />
                <Field label="Amount (KES)" value={String(form.amount)} onChange={set('amount')} type="number" required />
                <Field label="Payment Terms" value={form.payment_terms} onChange={set('payment_terms')} />
              </div>
              <Field label="Item/Service Description" value={form.description} onChange={set('description')} textarea />
              <Field label="Reason for Credit Note" value={form.reason} onChange={set('reason')} textarea />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setModalOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.credit_note_number.trim() || !form.customer_name.trim() || !form.amount}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Credit Note' : 'Create Credit Note'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type, required, textarea, readOnly,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string; required?: boolean; textarea?: boolean; readOnly?: boolean;
}) {
  const cls = "w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-brand ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={3} className={cls} />
      ) : (
        <input type={type || 'text'} value={value} onChange={onChange} required={required} readOnly={readOnly} className={cls} />
      )}
    </div>
  );
}
