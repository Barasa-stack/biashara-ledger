'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Package, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type InventoryItem = {
  id: string;
  item_name: string;
  sku: string;
  category: string;
  unit_of_measure: string;
  opening_stock: number;
  current_stock: number;
  unit_cost: number;
  created_at: string;
};

const emptyForm = {
  item_name: '',
  sku: '',
  category: '',
  unit_of_measure: 'pcs',
  opening_stock: 0,
  unit_cost: 0,
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const CATEGORIES = ['Raw Materials', 'Finished Goods', 'Office Supplies', 'Equipment', 'Merchandise', 'Packaging', 'Other'];
const UOM = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'ft', 'box', 'pack', 'dozen', 'unit'];

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchItems = () => {
    setLoading(true);
    setError('');
    fetch('/api/inventory/items')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load inventory'))
      .then(setItems)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(i =>
        (i.item_name || '').toLowerCase().includes(q) ||
        (i.sku || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, debouncedSearch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (i: InventoryItem) => {
    setEditing(i);
    setForm({
      item_name: i.item_name,
      sku: i.sku,
      category: i.category,
      unit_of_measure: i.unit_of_measure,
      opening_stock: i.opening_stock,
      unit_cost: i.unit_cost,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/inventory/items';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save item');
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      toast(e.message || 'Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!await confirm(`Delete "${item.item_name}"? This will also remove all transactions.`)) return;
    try {
      const res = await fetch('/api/inventory/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchItems();
    } catch (e: any) {
      toast(e.message || 'Error deleting item');
    }
  };

  const totalValue = items.reduce((s, i) => s + (i.current_stock || 0) * (i.unit_cost || 0), 0);
  const totalStock = items.reduce((s, i) => s + (i.current_stock || 0), 0);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Inventory Items</h1>
          <p className="text-sm text-[#000000]">{items.length} items · {totalStock} units · {fmtKES(totalValue)} total value</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-[#000000] bg-white" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-border">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No inventory items yet</p>
          <p className="text-sm mt-1">Add your first stock item to start tracking inventory.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-[#000000] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">SKU</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-right px-4 py-3 font-medium">Opening Stock</th>
                  <th className="text-right px-4 py-3 font-medium">Current Stock</th>
                  <th className="text-right px-4 py-3 font-medium">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Total Value</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 text-[#000000]">
                    <td className="px-4 py-3 font-medium">{item.item_name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.sku || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-brand/10 text-brand">{item.category || 'Uncategorized'}</span></td>
                    <td className="px-4 py-3 text-right">{item.opening_stock} {item.unit_of_measure}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.current_stock} {item.unit_of_measure}</td>
                    <td className="px-4 py-3 text-right">{fmtKES(item.unit_cost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtKES((item.current_stock || 0) * (item.unit_cost || 0))}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4 text-gray-500" /></button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const invColumns: { key: string; label: string }[] = [
          { key: 'item_name', label: 'Item' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Category' },
          { key: 'unit_of_measure', label: 'Unit' },
          { key: 'opening_stock', label: 'Opening Stock' },
          { key: 'current_stock', label: 'Current Stock' },
          { key: 'unit_cost', label: 'Unit Cost' },
          { key: 'total_value', label: 'Total Value' },
        ];
        const invData = filteredItems.map(r => ({ ...r, opening_stock: String(r.opening_stock), current_stock: String(r.current_stock), unit_cost: fmtKES(r.unit_cost), total_value: fmtKES((r.current_stock || 0) * (r.unit_cost || 0)) }));
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Export: </span>
            <button onClick={() => exportCSV(invData, invColumns, 'inventory-items.csv')} className="text-xs text-brand hover:underline">CSV</button>
            <button onClick={() => exportExcel(invData, invColumns, 'inventory-items.xlsx')} className="text-xs text-brand hover:underline">Excel</button>
            <button onClick={() => exportPDF('Inventory Items', invData, invColumns, 'inventory-items.pdf')} className="text-xs text-brand hover:underline">PDF</button>
            <button onClick={() => exportWord('Inventory Items', invData, invColumns, 'inventory-items.doc')} className="text-xs text-brand hover:underline">Word</button>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#000000]">{editing ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Item Name</label>
                <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">SKU</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Unit of Measure</label>
                  <select value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Unit Cost ($)</label>
                  <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Opening Stock</label>
                <input type="number" value={form.opening_stock} onChange={e => setForm({ ...form, opening_stock: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSubmit} disabled={saving || !form.item_name} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
