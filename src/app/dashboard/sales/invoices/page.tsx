'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileText, Download, Search, Filter, CheckCircle, Printer, XCircle, Mail } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';
import { buildHtml } from '@/lib/print';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { getVatRate } from '@/lib/vat-rates';
import { getCountryByCode } from '@/lib/countries';
import SearchableCountrySelect from '@/components/SearchableCountrySelect';

type Invoice = {
  id: string;
  invoice_number: string;
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
  vat_rate?: number;
  quotation_id?: string;
  paid_amount?: number;
};

type Customer = {
  id: string;
  customer_name: string;
  email_address: string;
  phone_number: string;
  billing_address: string;
  country: string;
};

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

type Quotation = {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  customer_country?: string;
  items: string;
  description?: string;
};

const emptyForm = {
  invoice_number: '', customer_id: '', customer_name: '', description: '',
  quantity: 1, unit_price: 0, subtotal: 0, tax_vat: 0, discounts: 0,
  amount: 0, payment_terms: 'Net 30', status: 'draft', issue_date: '', due_date: '',
  customer_country: '', vat_rate: 16, quotation_id: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUSES = ['draft', 'sent', 'unpaid', 'paid', 'partially_paid', 'overdue', 'declined', 'cancelled'];
const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast: showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [pageToast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendConfirm, setSendConfirm] = useState<{
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    item: any;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    invoice: Invoice;
    paymentType: 'full' | 'partial';
    partialAmount: string;
  } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (statusFilter) {
      list = list.filter(inv => inv.status === statusFilter);
    }
    if (dateFrom) {
      list = list.filter(inv => (inv.issue_date || '') >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(inv => (inv.issue_date || '') <= dateTo);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(inv =>
        (inv.invoice_number || '').toLowerCase().includes(q) ||
        (inv.customer_name || '').toLowerCase().includes(q) ||
        (inv.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, dateFrom, dateTo, debouncedSearch]);

  const exportColumns = [
    { key: 'invoice_number', label: 'Invoice#' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_country', label: 'Country' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
  ];

  const exportFileName = `invoices-${new Date().toISOString().split('T')[0]}`;

  useEffect(() => {
    if (pageToast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [pageToast]);

  const fetchInvoices = () => {
    setLoading(true);
    setError('');
    fetch('/api/sales/invoices')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load invoices'))
      .then(setInvoices)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .catch(() => {});
  };

  const fetchCompanyName = () => {
    fetch('/api/company')
      .then(r => r.ok ? r.json() : { company_name: 'BiasharaLedger', vat_rate: 0 })
      .then(d => {
        setCompanyName(d.company_name || 'BiasharaLedger');
        setVatRate(d.vat_rate ?? 0);
      })
      .catch(() => {
        setCompanyName('BiasharaLedger');
        setVatRate(0);
      });
  };

  const fetchQuotations = () => {
    fetch('/api/sales/quotations')
      .then(r => r.ok ? r.json() : [])
      .then(setQuotations)
      .catch(() => {});
  };

  useEffect(() => { fetchInvoices(); fetchCustomers(); fetchQuotations(); fetchCompanyName(); }, []);

  const activeVatRate = useMemo(() => {
    if (form.customer_country) return getVatRate(form.customer_country).rate;
    return vatRate;
  }, [form.customer_country, vatRate]);

  const activeVatLabel = useMemo(() => {
    const rate = form.vat_rate ?? (form.customer_country ? getVatRate(form.customer_country).rate : vatRate);
    if (rate === 0) return 'VAT (0%)';
    if (form.customer_country) {
      return `VAT (${rate}%)`;
    }
    return `VAT (${rate}%)`;
  }, [form.vat_rate, form.customer_country, vatRate]);

  const recalc = (f: typeof form, items?: LineItem[]) => {
    const useItems = items ?? lineItems;
    let subtotal = 0;
    if (useItems.length > 0) {
      subtotal = useItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
    } else {
      subtotal = (Number(f.quantity) || 0) * (Number(f.unit_price) || 0);
    }
    const rate = f.vat_rate !== undefined ? Number(f.vat_rate) : (f.customer_country ? getVatRate(f.customer_country).rate : vatRate);
    const vat = subtotal * rate / 100;
    const disc = Number(f.discounts) || 0;
    const amount = subtotal + vat - disc;
    const first = useItems[0];
    return { ...f, description: first?.description || f.description, quantity: useItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0), unit_price: first?.unit_price || f.unit_price, subtotal, tax_vat: vat, amount };
  };

  const openAdd = async () => {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setEditing(null);
    setLineItems([]);
    let nextNumber = '';
    try {
      const res = await fetch('/api/company/next-number?type=invoice');
      if (res.ok) {
        const data = await res.json();
        nextNumber = data.number || '';
      }
    } catch {}
    setForm(recalc({ ...emptyForm, invoice_number: nextNumber, issue_date: today, due_date: due }));
    setModalOpen(true);
  };

  const openEdit = (inv: any) => {
    setEditing(inv);
    let items: LineItem[] = [];
    try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : []); } catch {}
    setLineItems(items);
    setForm(recalc({
      invoice_number: inv.invoice_number,
      customer_id: inv.customer_id,
      customer_name: inv.customer_name,
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
      customer_country: inv.customer_country || '',
      vat_rate: inv.vat_rate ?? (inv.customer_country ? getVatRate(inv.customer_country).rate : vatRate),
      quotation_id: inv.quotation_id || '',
    }, items));
    setModalOpen(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = field === 'customer_id' ? e.target.value : (field === 'quantity' || field === 'unit_price' || field === 'subtotal' || field === 'tax_vat' || field === 'discounts' || field === 'amount' ? Number(e.target.value) : e.target.value);
    setForm(prev => recalc({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/sales/invoices';
      const method = editing ? 'PUT' : 'POST';
      const body = { ...form, items: JSON.stringify(lineItems), id: editing?.id || undefined };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || 'Save failed');
      }
      setModalOpen(false);
      fetchInvoices();
      setToast({ message: editing ? 'Invoice updated' : 'Invoice created', type: 'success' });
    } catch (e: any) {
      showToast(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendConfirm) return;
    setSendingEmail(true);
    try {
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sendConfirm.to,
          cc: sendConfirm.cc || undefined,
          bcc: sendConfirm.bcc || undefined,
          subject: sendConfirm.subject,
          message: 'Please find your invoice attached.',
          item: sendConfirm.item,
          type: 'Invoice',
        }),
      });
      if (emailRes.ok) {
        const emailData = await emailRes.json().catch(() => ({}));
        if (emailData.pdfError) {
          setToast({ message: `Invoice emailed (PDF not attached: ${emailData.pdfError})`, type: 'warning' });
        } else {
          setToast({ message: 'Invoice emailed successfully', type: 'success' });
        }
      } else {
        const errData = await emailRes.json().catch(() => ({}));
        setToast({ message: `Email failed: ${errData.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: `Email failed: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSendingEmail(false);
      setSendConfirm(null);
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!await confirm(`Delete invoice "${inv.invoice_number}"?`)) return;
    const prev = invoices;
    setInvoices(prev => prev.filter(i => i.id !== inv.id));
    try {
      const res = await fetch('/api/sales/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Invoice deleted', 'success');
    } catch (e: any) {
      setInvoices(prev);
      showToast(e.message || 'Delete failed');
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    const remaining = inv.amount - (inv.paid_amount || 0);
    setPaymentModal({ invoice: inv, paymentType: remaining >= inv.amount ? 'full' : 'partial', partialAmount: '' });
  };

  const handleSendClick = (inv: Invoice) => {
    // Find customer email from invoices or customers list
    const customer = customers.find(c => c.id === inv.customer_id);
    const email = customer?.email_address || '';
    if (!email) {
      setToast({ message: 'No email address on file for this customer', type: 'warning' });
      return;
    }
    setSendConfirm({
      to: email,
      cc: '',
      bcc: '',
      subject: `Invoice ${inv.invoice_number} from ${companyName || 'BiasharaLedger'}`,
      item: inv,
    });
  };

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    setProcessingPayment(true);
    try {
      const paidAmount = paymentModal.paymentType === 'partial' ? Number(paymentModal.partialAmount) : paymentModal.invoice.amount;
      if (!paidAmount || paidAmount <= 0) throw new Error('Invalid payment amount');
      const res = await fetch('/api/sales/invoices/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentModal.invoice.id,
          payment_type: paymentModal.paymentType,
          partial_amount: paidAmount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark as paid');
      }
      const result = await res.json();
      fetchInvoices();
      setPaymentModal(null);
      const paidLabel = `Invoice "${paymentModal.invoice.invoice_number}" ${paymentModal.paymentType === 'partial' ? `partially paid (${fmtKES(paidAmount)})` : 'marked as paid'}`;
      const receiptMsg = result.emailSent ? '. Receipt emailed to customer.' : result.emailError ? `. Receipt email failed: ${result.emailError}` : '';
      setToast({ message: paidLabel + receiptMsg, type: result.emailError ? 'warning' : 'success' });
    } catch (e: any) {
      showToast(e.message || 'Failed to mark as paid');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDecline = async (inv: Invoice) => {
    if (!await confirm(`Mark invoice "${inv.invoice_number}" as declined by customer?`)) return;
    try {
      const res = await fetch('/api/sales/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inv, status: 'declined' }),
      });
      if (!res.ok) throw new Error('Failed to decline invoice');
      fetchInvoices();
      setToast({ message: `Invoice "${inv.invoice_number}" marked as declined`, type: 'success' });
    } catch (e: any) {
      showToast(e.message || 'Failed to decline invoice');
    }
  };

  let companyCache: any = null;

  const handlePrint = async (inv: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    try {
      if (!companyCache) {
        const res = await fetch('/api/company');
        companyCache = res.ok ? await res.json() : {};
      }
      const html = buildHtml('Invoice', inv, companyCache);
      w.document.write(html);
      w.document.close();
    } catch {
      w.document.write('<p>Failed to load invoice template.</p>');
      w.document.close();
    }
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      sent: 'bg-blue-100 text-blue-700',
      unpaid: 'bg-gray-100 text-gray-600',
      paid: 'bg-red-100 text-red-700',
      partially_paid: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
      declined: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-200 text-gray-500',
    };
    return (
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${colors[s] || 'bg-gray-100 text-gray-600'}`}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load invoices</p>
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
            <h1 className="text-lg font-semibold text-gray-800">Invoices</h1>
            <p className="text-xs text-gray-500">Manage sales invoices</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="From"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="To"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(dateFrom || dateTo || statusFilter || searchQuery) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }}
                className="text-xs text-gray-500 hover:text-brand px-2 py-1.5"
              >
                Clear
              </button>
            )}
            <div className="relative group">
              <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-[140px] hidden group-hover:block">
                <button onClick={() => exportCSV(filteredInvoices, exportColumns, `KSh {exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                <button onClick={() => exportExcel(filteredInvoices, exportColumns, `KSh {exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
                <button onClick={() => exportPDF('Sales Invoices', filteredInvoices, exportColumns, `KSh {exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                <button onClick={() => exportWord('Sales Invoices', filteredInvoices, exportColumns, `KSh {exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
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
              <span className="text-sm text-gray-600">Loading invoices...</span>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">No invoices yet</p>
            <p className="text-xs text-gray-400 mb-4">Create your first invoice</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Search className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No invoices match your filters</p>
            <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="mt-2 text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Invoice#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Country</th>
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
                    <td className="py-3 pr-4 text-gray-700">{inv.customer_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{inv.customer_country || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(inv.amount)}</td>
                    <td className="py-3 pr-4">{statusBadge(inv.status)}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.issue_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.due_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partially_paid') && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'unpaid') && (
                          <button
                            onClick={() => handleDecline(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Decline"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {(inv.status !== 'cancelled' && inv.status !== 'declined') && (
                          <button
                            onClick={() => handleSendClick(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Email to customer"
                          >
                            <Mail className="h-4 w-4" />
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

      {pageToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          pageToast.type === 'success' ? 'bg-red-600' : pageToast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <span>{pageToast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-800">
                {editing ? 'Edit Invoice' : 'New Invoice'}
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
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Invoice Number *</label>
                  <input type="text" value={form.invoice_number} readOnly className="w-full border border-border bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">From Quotation</label>
                  <select
                    value={form.quotation_id}
                    onChange={e => {
                      const qId = e.target.value;
                      if (!qId) return;
                      const q = quotations.find(q => String(q.id) === qId);
                      if (!q) return;
                      const c = customers.find(c => String(c.id) === q.customer_id);
                      let items: LineItem[] = [];
                      try { items = JSON.parse(q.items); } catch {}
                      if (!items.length) items = [{ description: q.items || q.description || '', quantity: 1, unit_price: 0 }];
                      setLineItems(items);
                      setForm(prev => recalc({ ...prev, quotation_id: qId, customer_id: q.customer_id, customer_name: q.customer_name, customer_country: q.customer_country || c?.country || '' }, items));
                    }}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">No quotation</option>
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>{q.quotation_number} — {q.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer *</label>
                    <select
                      value={form.customer_id}
                      onChange={e => {
                        const id = e.target.value;
                        const c = customers.find(c => String(c.id) === id);
                        setForm(prev => recalc({ ...prev, quotation_id: '', customer_id: id, customer_name: c?.customer_name || '', customer_country: c?.country || '' }));
                        setLineItems([]);
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
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Country</label>
                  <SearchableCountrySelect value={form.customer_country} onChange={code => setForm(prev => recalc({ ...prev, customer_country: code }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Line Items</label>
                  <button
                    type="button"
                    onClick={() => setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])}
                    className="text-xs text-brand font-medium hover:text-gray-800 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
                {lineItems.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-3 px-3 border border-dashed border-border rounded-lg">
                    Select a quotation above or add items manually
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-surface/50 p-2 rounded-lg border border-border">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => {
                              const next = [...lineItems];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setLineItems(next);
                              setForm(prev => recalc(prev, next));
                            }}
                            placeholder="Item description"
                            className="w-full border border-border bg-white rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand mb-1"
                          />
                        </div>
                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => {
                              const next = [...lineItems];
                              next[idx] = { ...next[idx], quantity: Number(e.target.value) || 0 };
                              setLineItems(next);
                              setForm(prev => recalc(prev, next));
                            }}
                            placeholder="Qty"
                            className="w-full border border-border bg-white rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand text-center"
                          />
                        </div>
                        <div className="w-28 shrink-0">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={e => {
                              const next = [...lineItems];
                              next[idx] = { ...next[idx], unit_price: Number(e.target.value) || 0 };
                              setLineItems(next);
                              setForm(prev => recalc(prev, next));
                            }}
                            placeholder="Price"
                            className="w-full border border-border bg-white rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand text-right"
                          />
                        </div>
                        <div className="w-24 shrink-0 flex items-center justify-end pr-1">
                          <span className="text-sm font-medium text-gray-700">{fmtKES((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = lineItems.filter((_, i) => i !== idx);
                            setLineItems(next);
                            setForm(prev => recalc(prev, next));
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">VAT Rate</label>
                  <select
                    value={form.vat_rate ?? 16}
                    onChange={e => {
                      const rate = Number(e.target.value);
                      setForm(prev => recalc({ ...prev, vat_rate: rate }));
                    }}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value={0}>0% (Zero Rated)</option>
                    <option value={16}>16% VAT</option>
                  </select>
                </div>
                <Field label="Discounts (KES)" value={String(form.discounts)} onChange={set('discounts')} type="number" />
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{fmtKES(form.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{activeVatLabel}</span>
                  <span className="font-medium text-gray-800">{fmtKES(form.tax_vat)}</span>
                </div>
                {form.discounts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Discounts</span>
                    <span className="font-medium text-red-500">-{fmtKES(form.discounts)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total Amount</span>
                  <span className="font-bold text-brand text-base">{fmtKES(form.amount)}</span>
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
                disabled={saving || !form.invoice_number.trim() || !form.customer_id}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Invoice' : 'Create Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Payment</h3>
              <p className="text-sm text-white/80 mt-1">{paymentModal.invoice.invoice_number}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-800">{paymentModal.invoice.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold text-gray-800">{fmtKES(paymentModal.invoice.amount)}</span>
              </div>

              <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-red-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentModal.paymentType === 'full'}
                      onChange={() => setPaymentModal({ ...paymentModal, paymentType: 'full', partialAmount: String(paymentModal.invoice.amount) })}
                      className="accent-red-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">Full Payment</span>
                      <p className="text-xs text-gray-500">Pay the full invoice amount</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-red-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentModal.paymentType === 'partial'}
                      onChange={() => {
                        setPaymentModal({ ...paymentModal, paymentType: 'partial', partialAmount: '' });
                      }}
                      className="accent-red-600 w-4 h-4"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">Partial Payment</span>
                      <p className="text-xs text-gray-500">Pay a portion of the amount</p>
                    </div>
                  </label>
                {paymentModal.paymentType === 'partial' && (
                  <div className="pl-7 space-y-2">
                    <div className="flex justify-between text-sm py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-amber-700 font-medium">Outstanding Balance</span>
                      <span className="text-amber-800 font-bold">{fmtKES(paymentModal.invoice.amount - (paymentModal.invoice.paid_amount || 0))}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount to be Paid</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">KES</span>
                        <input
                          type="number"
                          value={paymentModal.partialAmount}
                          onChange={e => setPaymentModal({ ...paymentModal, partialAmount: e.target.value })}
                          max={paymentModal.invoice.amount}
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button
                onClick={() => setPaymentModal(null)}
                disabled={processingPayment}
                className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processingPayment || (paymentModal.paymentType === 'partial' && (!Number(paymentModal.partialAmount) || Number(paymentModal.partialAmount) <= 0))}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-full max-w-md mx-4 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Send Invoice via Email?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Send invoice <strong>{sendConfirm.subject.replace(` from ${companyName || 'BiasharaLedger'}`, '')}</strong> to <strong>{sendConfirm.to}</strong>?
            </p>
            <div className="space-y-2 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CC</label>
                <input
                  type="text"
                  value={sendConfirm.cc}
                  onChange={e => setSendConfirm({ ...sendConfirm, cc: e.target.value })}
                  placeholder="cc@example.com, cc2@example.com"
                  className="w-full border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">BCC</label>
                <input
                  type="text"
                  value={sendConfirm.bcc}
                  onChange={e => setSendConfirm({ ...sendConfirm, bcc: e.target.value })}
                  placeholder="bcc@example.com"
                  className="w-full border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
              Make sure the invoice details are correct before sending.
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setSendConfirm(null); }}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {sendingEmail ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invoice'
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
