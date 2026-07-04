'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileText, Download, Search, Filter, Printer, XCircle } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { getVatRate } from '@/lib/vat-rates';
import { getCountryByCode } from '@/lib/countries';

type Quotation = {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
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
  customer_country?: string;
};

type Customer = {
  id: string;
  customer_name: string;
  email_address: string;
  country: string;
};

const emptyForm = {
  quotation_number: '', customer_id: '', customer_name: '', description: '',
  quantity: 1, unit_price: 0, subtotal: 0, tax_vat: 0, discounts: 0,
  amount: 0, payment_terms: 'Net 30', status: 'draft', issue_date: '', due_date: '',
  customer_country: '',
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'overdue'];
const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [vatRate, setVatRate] = useState(16);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();

  const filteredQuotations = useMemo(() => {
    let list = quotations;
    if (statusFilter) list = list.filter(q => q.status === statusFilter);
    if (dateFrom) list = list.filter(q => (q.issue_date || '') >= dateFrom);
    if (dateTo) list = list.filter(q => (q.issue_date || '') <= dateTo);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(item =>
        (item.quotation_number || '').toLowerCase().includes(q) ||
        (item.customer_name || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [quotations, statusFilter, dateFrom, dateTo, debouncedSearch]);

  const exportColumns = [
    { key: 'quotation_number', label: 'Quotation#' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_country', label: 'Country' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
  ];

  const exportFileName = `quotations-${new Date().toISOString().split('T')[0]}`;

  const fetchQuotations = () => {
    setLoading(true);
    setError('');
    fetch('/api/sales/quotations')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load quotations'))
      .then(setQuotations)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .catch(() => {});
  };

  useEffect(() => { fetchQuotations(); fetchCustomers(); }, []);

  useEffect(() => {
    fetch('/api/company')
      .then(r => r.ok ? r.json() : { vat_rate: 16 })
      .then(d => setVatRate(Number(d.vat_rate) || 16))
      .catch(() => setVatRate(16));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const activeVatRate = useMemo(() => {
    if (form.customer_country) return getVatRate(form.customer_country).rate;
    return vatRate;
  }, [form.customer_country, vatRate]);

  const activeVatLabel = useMemo(() => {
    if (form.customer_country) {
      const r = getVatRate(form.customer_country);
      return `VAT (${r.rate}%${r.rate > 0 ? '' : ' — No VAT'}${r.code !== 'XX' ? `, ${r.code}` : ''})`;
    }
    return `VAT (${vatRate}%)`;
  }, [form.customer_country, vatRate]);

  const recalc = (f: typeof form) => {
    const qty = Number(f.quantity) || 0;
    const price = Number(f.unit_price) || 0;
    const subtotal = qty * price;
    const rate = f.customer_country ? getVatRate(f.customer_country).rate : vatRate;
    const vat = subtotal * rate / 100;
    const disc = Number(f.discounts) || 0;
    const amount = subtotal + vat - disc;
    return { ...f, subtotal, tax_vat: vat, amount };
  };

  const openAdd = async () => {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setEditing(null);
    let nextNumber = '';
    try {
      const res = await fetch('/api/company/next-number?type=quotation');
      if (res.ok) {
        const data = await res.json();
        nextNumber = data.number || '';
      }
    } catch {}
    setForm(recalc({ ...emptyForm, quotation_number: nextNumber, issue_date: today, due_date: due }));
    setModalOpen(true);
  };

  const openEdit = (q: Quotation) => {
    setEditing(q);
    setForm(recalc({
      quotation_number: q.quotation_number,
      customer_id: q.customer_id,
      customer_name: q.customer_name,
      description: q.description,
      quantity: q.quantity,
      unit_price: q.unit_price,
      subtotal: q.subtotal,
      tax_vat: q.tax_vat,
      discounts: q.discounts,
      amount: q.amount,
      payment_terms: q.payment_terms,
      status: q.status,
      issue_date: q.issue_date?.split('T')[0] || '',
      due_date: q.due_date?.split('T')[0] || '',
      customer_country: q.customer_country || '',
    }));
    setModalOpen(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = field === 'customer_id' ? e.target.value : (field === 'quantity' || field === 'unit_price' || field === 'subtotal' || field === 'tax_vat' || field === 'discounts' || field === 'amount' ? Number(e.target.value) : e.target.value);
    setForm(prev => recalc({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/sales/quotations';
      const method = editing ? 'PUT' : 'POST';
      const payload = { ...recalc(form), vat_rate: activeVatRate };
      const body = editing ? { ...payload, id: editing.id } : payload;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setModalOpen(false);
      fetchQuotations();

      if (!editing) {
        const customer = customers.find(c => c.id === form.customer_id);
        const customerEmail = customer?.email_address;
        if (customerEmail && await confirm(`Send quotation "${form.quotation_number}" to ${customerEmail}?`)) {
          try {
            const emailRes = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: customerEmail,
                subject: `Quotation ${form.quotation_number} from Vibe`,
                message: 'Please find your quotation attached.',
                item: form,
                type: 'Quotation',
              }),
            });
            if (emailRes.ok) {
              const emailData = await emailRes.json().catch(() => ({}));
              if (emailData.pdfError) {
                setToast({ type: 'warning', message: `Quotation created and emailed (PDF not attached: ${emailData.pdfError})` });
              } else {
                setToast({ type: 'success', message: 'Quotation created and emailed' });
              }
            } else {
              const errData = await emailRes.json().catch(() => ({}));
              setToast({ type: 'error', message: `Quotation created but email failed: ${errData.error || 'Unknown error'}` });
            }
          } catch (e: any) {
            setToast({ type: 'error', message: `Quotation created but email failed: ${e.message || 'Unknown error'}` });
          }
        } else {
          setToast({ type: 'success', message: 'Quotation created' });
        }
      } else {
        setToast({ type: 'success', message: 'Quotation updated' });
      }
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Quotation) => {
    if (!await confirm(`Delete quotation "${q.quotation_number}"?`)) return;
    try {
      const res = await fetch('/api/sales/quotations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchQuotations();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Delete failed' });
    }
  };

  const handleDecline = async (q: Quotation) => {
    if (!await confirm(`Mark quotation "${q.quotation_number}" as declined by customer?`)) return;
    try {
      const res = await fetch('/api/sales/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...q, status: 'declined' }),
      });
      if (!res.ok) throw new Error('Failed to decline quotation');
      fetchQuotations();
      setToast({ type: 'success', message: `Quotation "${q.quotation_number}" marked as declined` });
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Failed to decline quotation' });
    }
  };

  const handlePrint = (q: Quotation) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const qVatRate = q.customer_country ? getVatRate(q.customer_country) : null;
    const vatLabel = qVatRate ? `VAT (${qVatRate.rate}%)` : `VAT (${vatRate}%)`;
    const buyerCountry = q.customer_country ? getCountryByCode(q.customer_country) : null;
    w.document.write(`
      <html>
        <head>
          <title>Quotation ${q.quotation_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: 700; color: #2563eb; }
            .details { margin-bottom: 30px; }
            .details p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding: 8px 12px; }
            td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .totals { margin-left: auto; width: 300px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .totals .grand { font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">QUOTATION</div>
            <div style="text-align:right">
              <p style="font-size:18px;font-weight:600">${q.quotation_number}</p>
              <p style="font-size:14px;color:#6b7280">${q.status.toUpperCase()}</p>
            </div>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${q.customer_name || '—'}</p>
            ${buyerCountry ? `<p><strong>Country:</strong> ${buyerCountry.flag} ${buyerCountry.name} (${buyerCountry.code})</p>` : ''}
            <p><strong>Issue Date:</strong> ${q.issue_date?.split('T')[0] || '—'}</p>
            <p><strong>Due Date:</strong> ${q.due_date?.split('T')[0] || '—'}</p>
            <p><strong>Payment Terms:</strong> ${q.payment_terms || '—'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${q.description || '—'}</td>
                <td style="text-align:right">${q.quantity}</td>
                <td style="text-align:right">${fmtUSD(q.unit_price)}</td>
                <td style="text-align:right">${fmtUSD(q.subtotal)}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>${fmtUSD(q.subtotal)}</span></div>
            <div><span>${vatLabel}</span><span>${fmtUSD(q.tax_vat)}</span></div>
            <div><span>Discounts</span><span>${fmtUSD(q.discounts)}</span></div>
            <div class="grand"><span>Total (incl. VAT)</span><span>${fmtUSD(q.amount)}</span></div>
          </div>
          <script>window.print();<\/script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-red-100 text-red-700',
      declined: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${colors[s] || 'bg-gray-100 text-gray-600'}`}>
        {s}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load quotations</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchQuotations} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Quotations</h1>
            <p className="text-xs text-gray-500">Manage sales quotations</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Quotation
        </button>
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search quotations..." className="w-full border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(dateFrom || dateTo || statusFilter || searchQuery) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-gray-500 hover:text-brand px-2 py-1.5">Clear</button>
            )}
            <div className="relative group">
              <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-[140px] hidden group-hover:block">
                <button onClick={() => exportCSV(filteredQuotations, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                <button onClick={() => exportExcel(filteredQuotations, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
                <button onClick={() => exportPDF('Sales Quotations', filteredQuotations, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                <button onClick={() => exportWord('Sales Quotations', filteredQuotations, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading quotations...</span>
            </div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">No quotations yet</p>
            <p className="text-xs text-gray-400 mb-4">Create your first quotation</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"><Plus className="h-4 w-4" /> New Quotation</button>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Search className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No quotations match your filters</p>
            <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="mt-2 text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Quotation#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Issue Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQuotations.map((q, i) => (
                  <tr key={q.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredQuotations.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{q.quotation_number}</td>
                    <td className="py-3 pr-4 text-gray-700">{q.customer_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(q.amount)}</td>
                    <td className="py-3 pr-4">{statusBadge(q.status)}</td>
                    <td className="py-3 pr-4 text-gray-700">{q.issue_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(q)} className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        {(q.status === 'sent') && (
                          <button onClick={() => handleDecline(q)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Decline"><XCircle className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => handlePrint(q)} className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors" title="Print"><Printer className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(q)} className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
                {editing ? 'Edit Quotation' : 'New Quotation'}
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
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Quotation Number *</label>
                  <input type="text" value={form.quotation_number} readOnly className="w-full border border-border bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer *</label>
                    <select
                      value={form.customer_id}
                      onChange={e => {
                        const id = e.target.value;
                        const c = customers.find(c => String(c.id) === id);
                        setForm(prev => recalc({ ...prev, customer_id: id, customer_name: c?.customer_name || '', customer_country: c?.country || '' }));
                      }}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Select customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.customer_name}</option>
                    ))}
                  </select>
                </div>
                <Field label="Issue Date" value={form.issue_date} onChange={set('issue_date')} type="date" />
                <Field label="Due Date" value={form.due_date} onChange={set('due_date')} type="date" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Payment Terms</label>
                  <select value={form.payment_terms} onChange={set('payment_terms')} className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand">
                    {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={set('status')} className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Item/Service Description" value={form.description} onChange={set('description')} textarea />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Field label="Quantity" value={String(form.quantity)} onChange={set('quantity')} type="number" />
                <Field label="Unit Price (USD)" value={String(form.unit_price)} onChange={set('unit_price')} type="number" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{activeVatLabel}</label>
                  <input type="number" value={String(Math.round(form.tax_vat * 100) / 100)} readOnly className="w-full border border-border bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 cursor-not-allowed" />
                </div>
                <Field label="Discounts (USD)" value={String(form.discounts)} onChange={set('discounts')} type="number" />
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{fmtUSD(form.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{activeVatLabel}</span>
                  <span className="font-medium text-gray-800">{fmtUSD(form.tax_vat)}</span>
                </div>
                {form.discounts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Discounts</span>
                    <span className="font-medium text-red-500">-{fmtUSD(form.discounts)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total Amount</span>
                  <span className="font-bold text-brand text-base">{fmtUSD(form.amount)}</span>
                </div>
              </div>
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
                disabled={saving || !form.quotation_number.trim() || !form.customer_id}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Quotation' : 'Create Quotation'
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

function Field({
  label, value, onChange, type, required, textarea,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string; required?: boolean; textarea?: boolean;
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
        <input type={type || 'text'} value={value} onChange={onChange} required={required} className={cls} />
      )}
    </div>
  );
}
