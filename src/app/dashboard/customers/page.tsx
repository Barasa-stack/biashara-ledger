'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Search, Download, Upload } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;
import { countries } from '@/lib/countries';
import ImportModal from '@/components/ImportModal';

type Customer = {
  id: string;
  customer_name: string;
  company_name: string;
  contact_person: string;
  email_address: string;
  phone_number: string;
  billing_address: string;
  shipping_address: string;
  tax_id: string;
  country: string;
  payment_terms: string;
  credit_limit: number;
  notes: string;
  created_at: string;
};

const emptyForm = {
  customer_name: '', company_name: '', contact_person: '', email_address: '',
  phone_number: '', billing_address: '', shipping_address: '', tax_id: '',
  country: '', payment_terms: 'Net 30', credit_limit: 0, notes: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchCustomers = () => {
    setLoading(true);
    setError('');
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load customers'))
      .then(setCustomers)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase();
    return customers.filter(c =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.email_address || '').toLowerCase().includes(q)
    );
  }, [customers, debouncedSearch]);

  const exportColumns = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'email_address', label: 'Email' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'credit_limit', label: 'Credit Limit' },
  ];

  const exportFileName = `customers-${new Date().toISOString().split('T')[0]}`;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      customer_name: c.customer_name,
      company_name: c.company_name,
      contact_person: c.contact_person,
      email_address: c.email_address,
      phone_number: c.phone_number,
      billing_address: c.billing_address,
      shipping_address: c.shipping_address,
      tax_id: c.tax_id,
      country: c.country,
      payment_terms: c.payment_terms,
      credit_limit: c.credit_limit,
      notes: c.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/customers';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Save failed (${res.status})`);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      toast(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (!await confirm(`Delete customer "${c.customer_name}"? This cannot be undone.`)) return;
    const prev = customers;
    setCustomers(prev => prev.filter(cust => cust.id !== c.id));
    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast('Customer deleted', 'success');
    } catch (e: any) {
      setCustomers(prev);
      toast(e.message || 'Delete failed');
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: field === 'credit_limit' ? Number(e.target.value) : e.target.value }));

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load customers</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchCustomers} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Customers</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 border border-brand text-brand hover:bg-brand/5 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredCustomers, exportColumns, `KSh {exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredCustomers, exportColumns, `KSh {exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Customers', filteredCustomers, exportColumns, `KSh {exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Customers', filteredCustomers, exportColumns, `KSh {exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-brand font-medium hover:text-gray-800">Clear filter</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading customers...</span>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-sm text-gray-500 mb-1">No customers yet</p>
            <p className="text-xs text-gray-400 mb-4">Add your first customer to get started</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Company</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Payment Terms</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Credit Limit</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredCustomers.length - i}</td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-gray-800">{c.customer_name}</span>
                      {c.contact_person && (
                        <span className="block text-xs text-gray-400">{c.contact_person}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{c.company_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{c.email_address || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{c.phone_number || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{c.payment_terms}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(c.credit_limit)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
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
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-800">
                {editing ? 'Edit Customer' : 'Add Customer'}
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
                <Field label="Customer Name" value={form.customer_name} onChange={set('customer_name')} required />
                <Field label="Company Name" value={form.company_name} onChange={set('company_name')} />
                <Field label="Contact Person" value={form.contact_person} onChange={set('contact_person')} />
                <Field label="Email Address" value={form.email_address} onChange={set('email_address')} type="email" />
                <Field label="Phone Number" value={form.phone_number} onChange={set('phone_number')} />
                <Field label="Tax ID / VAT Reg" value={form.tax_id} onChange={set('tax_id')} />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Country *</label>
                  <select
                    value={form.country}
                    onChange={set('country')}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Select country</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Payment Terms</label>
                  <select
                    value={form.payment_terms}
                    onChange={set('payment_terms')}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                    <option>Due on Receipt</option>
                  </select>
                </div>
                <Field label="Credit Limit (KES)" value={String(form.credit_limit)} onChange={set('credit_limit')} type="number" />
              </div>
              <Field label="Billing Address" value={form.billing_address} onChange={set('billing_address')} textarea />
              <Field label="Shipping Address" value={form.shipping_address} onChange={set('shipping_address')} textarea />
              <Field label="Notes" value={form.notes} onChange={set('notes')} textarea />
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
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Customer' : 'Add Customer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {importOpen && (
        <ImportModal
          title="Import Customers"
          apiEndpoint="/api/import/customers"
          templateFilename="customer-import-template.csv"
          existingEmails={customers.map(c => c.email_address).filter(Boolean)}
          fields={[
            { key: 'customer_name', label: 'Customer Name', required: true },
            { key: 'company_name', label: 'Company Name' },
            { key: 'contact_person', label: 'Contact Person' },
            { key: 'email_address', label: 'Email', type: 'email' },
            { key: 'phone_number', label: 'Phone', type: 'tel' },
            { key: 'billing_address', label: 'Billing Address' },
            { key: 'shipping_address', label: 'Shipping Address' },
            { key: 'tax_id', label: 'Tax ID / VAT' },
            { key: 'country', label: 'Country' },
            { key: 'payment_terms', label: 'Payment Terms' },
            { key: 'credit_limit', label: 'Credit Limit', type: 'number' },
            { key: 'notes', label: 'Notes' },
          ]}
          onClose={() => setImportOpen(false)}
          onSuccess={() => { setImportOpen(false); fetchCustomers(); }}
        />
      )}
      {dialog}
    </div>
  );
}

function Field({
  label, value, onChange, type, required, textarea,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string; required?: boolean; textarea?: boolean;
}) {
  const cls = "w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand";
  return (
    <div className={textarea ? '' : ''}>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-brand ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={3} className={cls} />
      ) : (
        <input type={type || 'text'} value={value} onChange={onChange} required={required} className={cls} />
      )}
    </div>
  );
}
