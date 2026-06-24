'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Banknote, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';

type Payment = {
  id: number;
  invoice_id: number;
  invoice_number?: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
};

const fmtKES = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchPayments = () => {
    setLoading(true);
    setError('');
    fetch('/api/sales/payments')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load payments'))
      .then(setPayments)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    if (dateFrom) list = list.filter(p => (p.payment_date || '') >= dateFrom);
    if (dateTo) list = list.filter(p => (p.payment_date || '') <= dateTo);
    if (statusFilter) list = list.filter(p => p.payment_method === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(p => (p.customer_name || '').toLowerCase().includes(q) || String(p.invoice_number || p.invoice_id).includes(q));
    }
    return list;
  }, [payments, dateFrom, dateTo, statusFilter, debouncedSearch]);

  const exportColumns = [
    { key: 'id', label: 'Payment ID' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'amount', label: 'Amount (KES)' },
    { key: 'payment_method', label: 'Method' },
    { key: 'payment_date', label: 'Date' },
    { key: 'notes', label: 'Notes' },
  ];

  const exportFileName = `payments-${new Date().toISOString().split('T')[0]}`;

  const methodBadge = (m: string) => (
    <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded capitalize">{m}</span>
  );

  const statusBadge = () => (
    <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">Completed</span>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load payments</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchPayments} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Banknote className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Payments</h1>
            <p className="text-xs text-gray-500">View completed payments</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
      <Search className="h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search by customer or invoice..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full"
      />
    </div>
    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
    <span className="text-xs text-gray-400">to</span>
    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
      <option value="">All Methods</option>
      <option value="cash">Cash</option>
      <option value="bank">Bank</option>
      <option value="mpesa">M-Pesa</option>
      <option value="cheque">Cheque</option>
    </select>
    <div className="relative group">
      <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
        <Download className="h-4 w-4" />
        Export
      </button>
      <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
        <button onClick={() => exportCSV(filteredPayments, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
        <button onClick={() => exportExcel(filteredPayments, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
        <button onClick={() => exportPDF('Payments', filteredPayments, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
        <button onClick={() => exportWord('Payments', filteredPayments, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
      </div>
    </div>
    {(dateFrom || dateTo || statusFilter || searchQuery) && (
      <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">
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
              <span className="text-sm text-gray-600">Loading payments...</span>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Banknote className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">{payments.length === 0 ? 'No payments recorded yet' : 'No payments match your filters'}</p>
            <p className="text-xs text-gray-400 mb-4">{payments.length === 0 ? 'Payments are automatically created when an invoice is marked as paid.' : 'Try adjusting your search or filters'}</p>
            {payments.length !== 0 && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }} className="text-sm text-brand font-medium hover:text-gray-800">
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Invoice#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Method</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredPayments.length - i}</td>
                    <td className="py-3 pr-4 text-gray-700">{p.invoice_number || `#${p.invoice_id}`}</td>
                    <td className="py-3 pr-4 text-gray-700">{p.customer_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtKES(p.amount)}</td>
                    <td className="py-3 pr-4">{methodBadge(p.payment_method)}</td>
                    <td className="py-3 pr-4">{statusBadge()}</td>
                    <td className="py-3 pr-4 text-gray-700">{p.payment_date?.split('T')[0] || '—'}</td>
                    <td className="py-3 text-gray-500 max-w-[120px] truncate">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
