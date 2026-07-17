'use client';

import { useMemo } from 'react';
import { Plus, FileText, Search, Filter, Download, Pencil, Trash2, CheckCircle, Printer, XCircle, Mail, X } from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';
import { Invoice, fmtKES, STATUSES } from '@/types/invoices';

type Props = {
  invoices: Invoice[];
  loading: boolean;
  error: string;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  searchQuery: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onSearchQueryChange: (v: string) => void;
  onClearFilters: () => void;
  onAdd: () => void;
  onEdit: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  onMarkPaid: (inv: Invoice) => void;
  onDecline: (inv: Invoice) => void;
  onPrint: (inv: Invoice) => void;
  onSendEmail: (inv: Invoice) => void;
  onRetry: () => void;
};

export function InvoiceTable({
  invoices, loading, error,
  dateFrom, dateTo, statusFilter, searchQuery,
  onDateFromChange, onDateToChange, onStatusFilterChange, onSearchQueryChange,
  onClearFilters, onAdd, onEdit, onDelete, onMarkPaid, onDecline, onPrint, onSendEmail, onRetry,
}: Props) {
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
          <button onClick={onRetry} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
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
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="From"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="To"
          />
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
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
              onChange={e => onSearchQueryChange(e.target.value)}
              placeholder="Search invoices..."
              className="w-full border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(dateFrom || dateTo || statusFilter || searchQuery) && (
              <button
                onClick={onClearFilters}
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
              onClick={onAdd}
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
            <button onClick={onClearFilters} className="mt-2 text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
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
                        {(inv.status === 'draft' || inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partially_paid') && (
                          <button
                            onClick={() => onMarkPaid(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'unpaid') && (
                          <button
                            onClick={() => onDecline(inv)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Decline"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onPrint(inv)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {(inv.status !== 'cancelled' && inv.status !== 'declined') && (
                          <button
                            onClick={() => onSendEmail(inv)}
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
    </>
  );
}
