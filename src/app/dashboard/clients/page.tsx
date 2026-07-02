'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Building2, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;

type Client = {
  id: string;
  supplier_name: string;
  company_name: string;
  contact_person: string;
  email_address: string;
  phone_number: string;
  address: string;
  bank_details: string;
  tax_id: string;
  payment_terms: string;
  supplier_category: string;
  notes: string;
};

const emptyForm = {
  supplier_name: '',
  company_name: '',
  contact_person: '',
  email_address: '',
  phone_number: '',
  address: '',
  bank_details: '',
  tax_id: '',
  payment_terms: 'Net 30',
  supplier_category: '',
  notes: '',
};

const fmt = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const CATEGORIES = ['Raw Materials', 'Packaging', 'Services', 'Transport', 'Equipment', 'Technology', 'Consulting', 'Other'];
const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchClients = () => {
    setLoading(true);
    setError('');
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load suppliers'))
      .then(data => setClients(data))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    let list = [...clients];
    if (categoryFilter) list = list.filter(c => c.supplier_category === categoryFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(c =>
        (c.supplier_name || '').toLowerCase().includes(q) ||
        (c.company_name || '').toLowerCase().includes(q) ||
        (c.email_address || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, categoryFilter, debouncedSearch]);

  const exportColumns = [
    { key: 'supplier_name', label: 'Supplier Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'email_address', label: 'Email' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'supplier_category', label: 'Category' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'tax_id', label: 'Tax ID' },
  ];

  const exportFileName = `suppliers-${new Date().toISOString().split('T')[0]}`;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      supplier_name: c.supplier_name,
      company_name: c.company_name,
      contact_person: c.contact_person,
      email_address: c.email_address,
      phone_number: c.phone_number,
      address: c.address,
      bank_details: c.bank_details,
      tax_id: c.tax_id,
      payment_terms: c.payment_terms,
      supplier_category: c.supplier_category,
      notes: c.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = editing ? '/api/clients' : '/api/clients';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save supplier');
      setShowModal(false);
      fetchClients();
    } catch (e: any) {
      toast(e.message || 'Error saving supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Client) => {
    if (!await confirm(`Delete supplier "${c.supplier_name}"?`)) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchClients();
    } catch (e: any) {
      toast(e.message || 'Error deleting supplier');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load suppliers</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchClients} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Suppliers</h1>
            <p className="text-xs text-gray-500">Manage your suppliers and vendors</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search suppliers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredClients, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredClients, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Suppliers', filteredClients, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Suppliers', filteredClients, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(categoryFilter || searchQuery) && (
            <button onClick={() => { setCategoryFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading suppliers...</span>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Building2 className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No suppliers yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Supplier Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Company</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Category</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Payment Terms</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((c, i) => (
                  <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredClients.length - i}</td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-gray-800">{c.supplier_name}</span>
                      {c.contact_person && <p className="text-xs text-gray-400 mt-0.5">{c.contact_person}</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-800">{c.company_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-800">{c.email_address || '—'}</td>
                    <td className="py-3 pr-4 text-gray-800">{c.phone_number || '—'}</td>
                    <td className="py-3 pr-4">
                      {c.supplier_category ? (
                        <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">{c.supplier_category}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-800">{c.payment_terms || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
                {editing ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Supplier Name *" value={form.supplier_name} onChange={v => setForm(p => ({ ...p, supplier_name: v }))} required />
                <Field label="Company Name" value={form.company_name} onChange={v => setForm(p => ({ ...p, company_name: v }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Person" value={form.contact_person} onChange={v => setForm(p => ({ ...p, contact_person: v }))} />
                <Field label="Email Address" value={form.email_address} onChange={v => setForm(p => ({ ...p, email_address: v }))} type="email" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone Number" value={form.phone_number} onChange={v => setForm(p => ({ ...p, phone_number: v }))} />
                <Select label="Supplier Category" value={form.supplier_category} onChange={v => setForm(p => ({ ...p, supplier_category: v }))} options={CATEGORIES} blank="Select category" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Payment Terms" value={form.payment_terms} onChange={v => setForm(p => ({ ...p, payment_terms: v }))} options={PAYMENT_TERMS} />
                <Field label="Tax ID / KRA PIN" value={form.tax_id} onChange={v => setForm(p => ({ ...p, tax_id: v }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bank Details</label>
                <textarea value={form.bank_details} onChange={e => setForm(p => ({ ...p, bank_details: e.target.value }))} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.supplier_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Supplier' : 'Add Supplier'
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

function Select({ label, value, onChange, options, blank }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  blank?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
      >
        {blank && <option value="">{blank}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
