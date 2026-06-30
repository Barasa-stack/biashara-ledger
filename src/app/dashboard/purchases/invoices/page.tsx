'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileText, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';

type Invoice = {
  id: string;
  invoice_number: string;
  po_id: string;
  client_id: string;
  client_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_vat: number;
  discounts: number;
  amount: number;
  payment_terms: string;
  status: string;
  issue_date: string;
  due_date: string;
  created_at: string;
};

type Client = {
  id: string;
  supplier_name: string;
};

const emptyForm = {
  invoice_number: '',
  po_id: '',
  client_id: '',
  client_name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  subtotal: 0,
  tax_vat: 0,
  discounts: 0,
  amount: 0,
  payment_terms: 'Net 30',
  status: 'Draft',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

const STATUSES = ['Draft', 'Sent', 'Approved', 'Partial', 'Paid', 'Overdue', 'Cancelled'];
const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchInvoices = () => {
    setLoading(true);
    setError('');
    fetch('/api/purchases/invoices')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load purchase invoices'))
      .then(setInvoices)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchClients = () =>
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : [])
      .then(setClients)
      .catch(() => {});

  useEffect(() => { fetchInvoices(); fetchClients(); }, []);

  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (statusFilter) list = list.filter(inv => inv.status === statusFilter);
    if (dateFrom) list = list.filter(inv => (inv.issue_date || '') >= dateFrom);
    if (dateTo) list = list.filter(inv => (inv.issue_date || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(inv =>
        (inv.invoice_number || '').toLowerCase().includes(q) ||
        (inv.client_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, dateFrom, dateTo, statusFilter, debouncedSearch]);

  const exportColumns = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'client_name', label: 'Supplier' },
    { key: 'amount', label: 'Amount (KES)' },
    { key: 'status', label: 'Status' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
  ];

  const exportFileName = `purchase-invoices-${new Date().toISOString().split('T')[0]}`;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({
      invoice_number: inv.invoice_number,
      po_id: inv.po_id,
      client_id: inv.client_id,
      client_name: inv.client_name,
      description: inv.description,
      quantity: inv.quantity,
      unit_price: inv.unit_price,
      subtotal: inv.subtotal,
      tax_vat: inv.tax_vat,
      discounts: inv.discounts,
      amount: inv.amount,
      payment_terms: inv.payment_terms,
      status: inv.status,
      issue_date: inv.issue_date?.split('T')[0] || '',
      due_date: inv.due_date?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/purchases/invoices';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save invoice');
      setShowModal(false);
      fetchInvoices();
    } catch (e: any) {
      alert(e.message || 'Error saving invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Delete invoice "${inv.invoice_number}"?`)) return;
    try {
      const res = await fetch('/api/purchases/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchInvoices();
    } catch (e: any) {
      alert(e.message || 'Error deleting invoice');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  useEffect(() => {
    const qty = Number(form.quantity) || 0;
    const price = Number(form.unit_price) || 0;
    const sub = qty * price;
    const tax = Number(form.tax_vat) || 0;
    const disc = Number(form.discounts) || 0;
    const amt = sub + tax - disc;
    setForm(prev => ({ ...prev, subtotal: sub, amount: amt >= 0 ? amt : 0 }));
  }, [form.quantity, form.unit_price, form.tax_vat, form.discounts]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load purchase invoices</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchInvoices} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <h1 className="text-lg font-semibold text-gray-800">Purchase Invoices</h1>
            <p className="text-xs text-gray-500">Manage supplier invoices</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by invoice or supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredInvoices, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredInvoices, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Purchase Invoices', filteredInvoices, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Purchase Invoices', filteredInvoices, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(dateFrom || dateTo || statusFilter || searchQuery) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading invoices...</span>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No purchase invoices yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Invoice#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Supplier</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Issue Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Due Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv, i) => (
                  <tr key={inv.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredInvoices.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{inv.invoice_number}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.client_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(inv.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        inv.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                        inv.status === 'Sent' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-KE') : '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-KE') : '—'}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(inv)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Invoice' : 'Add Invoice'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Invoice Number" value={form.invoice_number} onChange={set('invoice_number')} required />
                <Field label="PO Reference" value={form.po_id} onChange={set('po_id')} />
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
                <Field label="Client Name" value={form.client_name} onChange={set('client_name')} />
              </div>
              <Field label="Description" value={form.description} onChange={set('description')} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Quantity" value={String(form.quantity)} onChange={v => set('quantity')(Number(v) || 0)} type="number" />
                <Field label="Unit Price (KES)" value={String(form.unit_price)} onChange={v => set('unit_price')(Number(v) || 0)} type="number" />
                <Field label="Subtotal (KES)" value={String(form.subtotal)} onChange={set('subtotal')} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Tax/VAT (KES)" value={String(form.tax_vat)} onChange={v => set('tax_vat')(Number(v) || 0)} type="number" />
                <Field label="Discounts (KES)" value={String(form.discounts)} onChange={v => set('discounts')(Number(v) || 0)} type="number" />
                <Field label="Amount (KES)" value={String(form.amount)} onChange={v => set('amount')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Payment Terms</label>
                  <select
                    value={form.payment_terms}
                    onChange={e => set('payment_terms')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Issue Date" value={form.issue_date} onChange={set('issue_date')} type="date" />
                <Field label="Due Date" value={form.due_date} onChange={set('due_date')} type="date" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.invoice_number.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Invoice' : 'Add Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
