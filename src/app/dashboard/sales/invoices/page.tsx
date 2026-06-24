'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, FileText, Download, Search, Filter, CheckCircle, Printer, XCircle } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord, getDefaultDateRange } from '@/lib/export-utils';

type Invoice = {
  id: number;
  invoice_number: string;
  customer_id: number;
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
};

type Customer = {
  id: number;
  customer_name: string;
  email_address: string;
};

const emptyForm = {
  invoice_number: '', customer_id: 0, customer_name: '', description: '',
  quantity: 1, unit_price: 0, subtotal: 0, tax_vat: 0, discounts: 0,
  amount: 0, payment_terms: 'Net 30', status: 'draft', issue_date: '', due_date: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendConfirm, setSendConfirm] = useState<{
    to: string;
    subject: string;
    item: typeof form;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    invoice: Invoice;
    paymentType: 'full' | 'partial';
    partialAmount: string;
  } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
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
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
  ];

  const exportFileName = `invoices-${new Date().toISOString().split('T')[0]}`;

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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

  useEffect(() => { fetchInvoices(); fetchCustomers(); fetchCompanyName(); }, []);

  const recalc = (f: typeof form) => {
    const qty = Number(f.quantity) || 0;
    const price = Number(f.unit_price) || 0;
    const subtotal = qty * price;
    const vat = subtotal * vatRate / 100;
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
      const res = await fetch('/api/company/next-number?type=invoice');
      if (res.ok) {
        const data = await res.json();
        nextNumber = data.number || '';
      }
    } catch {}
    setForm(recalc({ ...emptyForm, invoice_number: nextNumber, issue_date: today, due_date: due }));
    setModalOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
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
    }));
    setModalOpen(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = field === 'customer_id' ? Number(e.target.value) : e.target.value;
    setForm(prev => recalc({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/sales/invoices';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setModalOpen(false);
      fetchInvoices();

      if (!editing) {
        const customer = customers.find(c => c.id === form.customer_id);
        if (customer?.email_address) {
          setSendConfirm({
            to: customer.email_address,
            subject: `Invoice ${form.invoice_number} from ${companyName || 'BiasharaLedger'}`,
            item: form,
          });
        } else {
          setToast({ message: 'Invoice created', type: 'success' });
        }
      }
    } catch (e: any) {
      alert(e.message || 'Save failed');
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
          subject: sendConfirm.subject,
          message: 'Please find your invoice attached.',
          item: sendConfirm.item,
          type: 'Invoice',
        }),
      });
      if (emailRes.ok) {
        const emailData = await emailRes.json().catch(() => ({}));
        if (emailData.pdfError) {
          setToast({ message: `Invoice created and emailed (PDF not attached: ${emailData.pdfError})`, type: 'warning' });
        } else {
          setToast({ message: 'Invoice created and emailed', type: 'success' });
        }
      } else {
        const errData = await emailRes.json().catch(() => ({}));
        setToast({ message: `Invoice created but email failed: ${errData.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: `Invoice created but email failed: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSendingEmail(false);
      setSendConfirm(null);
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Delete invoice "${inv.invoice_number}"?`)) return;
    try {
      const res = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchInvoices();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    setPaymentModal({ invoice: inv, paymentType: 'full', partialAmount: String(inv.amount) });
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
      alert(e.message || 'Failed to mark as paid');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDecline = async (inv: Invoice) => {
    if (!confirm(`Mark invoice "${inv.invoice_number}" as declined by customer?`)) return;
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
      alert(e.message || 'Failed to decline invoice');
    }
  };

  const handlePrint = (inv: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.invoice_number}</title>
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
            <div class="title">INVOICE</div>
            <div style="text-align:right">
              <p style="font-size:18px;font-weight:600">${inv.invoice_number}</p>
              <p style="font-size:14px;color:#6b7280">${inv.status.toUpperCase()}</p>
            </div>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${inv.customer_name || '—'}</p>
            <p><strong>Issue Date:</strong> ${inv.issue_date?.split('T')[0] || '—'}</p>
            <p><strong>Due Date:</strong> ${inv.due_date?.split('T')[0] || '—'}</p>
            <p><strong>Payment Terms:</strong> ${inv.payment_terms || '—'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.description || '—'}</td>
                <td style="text-align:right">${inv.quantity}</td>
                <td style="text-align:right">${fmtKES(inv.unit_price)}</td>
                <td style="text-align:right">${fmtKES(inv.subtotal)}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>${fmtKES(inv.subtotal)}</span></div>
            <div><span>VAT</span><span>${fmtKES(inv.tax_vat)}</span></div>
            <div><span>Discounts</span><span>${fmtKES(inv.discounts)}</span></div>
            <div class="grand"><span>Total</span><span>${fmtKES(inv.amount)}</span></div>
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
      unpaid: 'bg-gray-100 text-gray-600',
      paid: 'bg-green-100 text-green-700',
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
                <button onClick={() => exportCSV(filteredInvoices, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                <button onClick={() => exportExcel(filteredInvoices, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
                <button onClick={() => exportPDF('Sales Invoices', filteredInvoices, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                <button onClick={() => exportWord('Sales Invoices', filteredInvoices, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
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
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(inv.amount)}</td>
                    <td className="py-3 pr-4">{statusBadge(inv.status)}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.issue_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{inv.due_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partially_paid') && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <span>{toast.message}</span>
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
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer *</label>
                  <select
                    value={form.customer_id}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const c = customers.find(c => c.id === id);
                      setForm(prev => recalc({ ...prev, customer_id: id, customer_name: c?.customer_name || '' }));
                    }}
                    className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value={0}>Select customer</option>
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
                <Field label="Unit Price (KES)" value={String(form.unit_price)} onChange={set('unit_price')} type="number" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">VAT (KES)</label>
                  <div className="w-full border border-border bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 cursor-not-allowed">
                    {fmtKES(form.tax_vat)}
                  </div>
                </div>
                <Field label="Discounts (KES)" value={String(form.discounts)} onChange={set('discounts')} type="number" />
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="ml-2 font-medium text-gray-800">{fmtKES(form.subtotal)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="ml-2 font-bold text-brand">{fmtKES(form.amount)}</span>
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
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
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
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-green-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-400">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={paymentModal.paymentType === 'full'}
                    onChange={() => setPaymentModal({ ...paymentModal, paymentType: 'full', partialAmount: String(paymentModal.invoice.amount) })}
                    className="accent-green-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800">Full Payment</span>
                    <p className="text-xs text-gray-500">Pay the full invoice amount</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-green-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-400">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={paymentModal.paymentType === 'partial'}
                    onChange={() => setPaymentModal({ ...paymentModal, paymentType: 'partial', partialAmount: String(paymentModal.invoice.amount) })}
                    className="accent-green-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Partial Payment</span>
                    <p className="text-xs text-gray-500">Pay a portion of the amount</p>
                  </div>
                </label>
                {paymentModal.paymentType === 'partial' && (
                  <div className="pl-7">
                    <label className="block text-xs text-gray-500 mb-1">Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">KES</span>
                      <input
                        type="number"
                        value={paymentModal.partialAmount}
                        onChange={e => setPaymentModal({ ...paymentModal, partialAmount: e.target.value })}
                        max={paymentModal.invoice.amount}
                        min={0}
                        step="0.01"
                        className="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                    {Number(paymentModal.partialAmount) < paymentModal.invoice.amount && Number(paymentModal.partialAmount) > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Remaining: {fmtKES(paymentModal.invoice.amount - Number(paymentModal.partialAmount))}
                      </p>
                    )}
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
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
            <p className="text-sm text-gray-600 mb-6">
              Send invoice <strong>{sendConfirm.subject.replace(` from ${companyName || 'BiasharaLedger'}`, '')}</strong> to <strong>{sendConfirm.to}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setToast({ message: 'Invoice created', type: 'success' });
                  setSendConfirm(null);
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Don't Send
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
                  'Send'
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
