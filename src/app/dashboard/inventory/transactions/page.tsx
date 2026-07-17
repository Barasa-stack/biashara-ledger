'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, X, ArrowUpDown, Search, Download, Package } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type Transaction = {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type: string;
  reference_id: string;
  transaction_date: string;
  notes: string;
  created_at: string;
  item_name: string;
  sku: string;
};

type InventoryItem = {
  id: string;
  item_name: string;
  sku: string;
  current_stock: number;
  unit_of_measure: string;
};

const emptyForm = {
  item_id: '',
  transaction_type: 'PURCHASE',
  quantity: 0,
  unit_cost: 0,
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const TXN_TYPES = ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'];

export default function InventoryTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchTransactions = () => {
    fetch('/api/inventory/transactions')
      .then(r => r.ok ? r.json() : [])
      .then(setTransactions)
      .catch(() => {});
  };

  const fetchItems = () =>
    fetch('/api/inventory/items')
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => {});

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTransactions(), fetchItems()]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter) list = list.filter(t => t.transaction_type === typeFilter);
    if (dateFrom) list = list.filter(t => (t.transaction_date || '') >= dateFrom);
    if (dateTo) list = list.filter(t => (t.transaction_date || '') <= dateTo);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.item_name || '').toLowerCase().includes(q) ||
        (t.sku || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, dateFrom, dateTo, searchQuery]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.item_id) { toast('Please select an item'); return; }
    if (!form.quantity || form.quantity <= 0) { toast('Quantity must be greater than 0'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost),
      };

      if (form.transaction_type === 'SALE') {
        const item = items.find(i => i.id === form.item_id);
        if (item && body.quantity > item.current_stock) {
          if (!await confirm(`Stock is ${item.current_stock} ${item.unit_of_measure}. Selling ${body.quantity} will make stock negative. Continue?`)) {
            setSaving(false);
            return;
          }
        }
      }

      const res = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save transaction');
      setShowModal(false);
      fetchTransactions();
      fetchItems();
    } catch (e: any) {
      toast(e.message || 'Error saving transaction');
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = items.find(i => i.id === form.item_id);

  const typeColors: Record<string, string> = {
    PURCHASE: 'bg-green-100 text-green-700',
    SALE: 'bg-blue-100 text-blue-700',
    RETURN: 'bg-yellow-100 text-yellow-700',
    ADJUSTMENT: 'bg-purple-100 text-purple-700',
  };

  const totalQty = transactions.reduce((s, t) => s + (t.quantity || 0), 0);
  const totalCost = transactions.reduce((s, t) => s + (t.total_cost || 0), 0);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Stock Movements</h1>
          <p className="text-sm text-[#000000]">{transactions.length} movements · {fmtKES(totalCost)} total value</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Movement
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-[#000000] bg-white" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700">
          <option value="">All Types</option>
          {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-border">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No stock movements found</p>
          <p className="text-sm mt-1">Add your first movement to start tracking inventory changes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-[#000000] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-right px-4 py-3 font-medium">Quantity</th>
                  <th className="text-right px-4 py-3 font-medium">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 text-[#000000]">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{t.transaction_date ? new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('en-US') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${typeColors[t.transaction_type] || 'bg-gray-100 text-gray-600'}`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.item_name}</div>
                      <div className="text-xs text-gray-400">{t.sku || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{t.quantity} <span className="text-xs text-gray-400">{t.sku ? '' : ''}</span></td>
                    <td className="px-4 py-3 text-right">{fmtKES(t.unit_cost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtKES(t.total_cost)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{t.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const cols: { key: string; label: string }[] = [
          { key: 'transaction_date', label: 'Date' },
          { key: 'transaction_type', label: 'Type' },
          { key: 'item_name', label: 'Item' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'unit_cost', label: 'Unit Cost' },
          { key: 'total_cost', label: 'Total' },
          { key: 'notes', label: 'Notes' },
        ];
        const data = filtered.map(t => ({
          ...t,
          transaction_date: t.transaction_date ? new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('en-US') : '',
          unit_cost: fmtKES(t.unit_cost),
          total_cost: fmtKES(t.total_cost),
        }));
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Export: </span>
            <button onClick={() => exportCSV(data, cols, 'stock-movements.csv')} className="text-xs text-brand hover:underline">CSV</button>
            <button onClick={() => exportExcel(data, cols, 'stock-movements.xlsx')} className="text-xs text-brand hover:underline">Excel</button>
            <button onClick={() => exportPDF('Stock Movements', data, cols, 'stock-movements.pdf')} className="text-xs text-brand hover:underline">PDF</button>
            <button onClick={() => exportWord('Stock Movements', data, cols, 'stock-movements.doc')} className="text-xs text-brand hover:underline">Word</button>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-800">Add Stock Movement</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Item</label>
                <select value={form.item_id} onChange={e => {
                  const id = e.target.value;
                  const item = items.find(i => i.id === id);
                  setForm(p => ({ ...p, item_id: id, unit_cost: item?.unit_cost || 0 }));
                }} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                  <option value="">Select item</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.item_name} ({i.sku || 'no SKU'}) — {i.current_stock} in stock
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Type</label>
                  <select value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Unit Cost <span className="text-gray-400 font-normal">(auto-filled)</span></label>
                  <input type="number" step="0.01" value={form.unit_cost || ''} onChange={e => setForm({ ...form, unit_cost: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Date</label>
                  <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              {selectedItem && form.transaction_type === 'SALE' && form.quantity > selectedItem.current_stock && (
                <p className="text-xs text-red-500">Warning: Selling more than available stock ({selectedItem.current_stock})</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.item_id || !form.quantity}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {saving ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
                ) : (
                  'Add Movement'
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
