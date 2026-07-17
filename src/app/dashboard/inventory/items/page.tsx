'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Package, Search, Download, ChevronRight } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import FieldTooltip from '@/components/FieldTooltip';
import InventoryOnboarding from '@/components/InventoryOnboarding';

type InventoryItem = {
  id: string;
  item_name: string;
  sku: string;
  category: string;
  category_id: string;
  unit_of_measure: string;
  purchase_uom: string;
  sale_uom: string;
  opening_stock: number;
  current_stock: number;
  unit_cost: number;
  reorder_level: number;
  custom_fields: Record<string, any>;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

const emptyForm = {
  item_name: '',
  sku: '',
  category: '',
  category_id: '',
  unit_of_measure: 'pcs',
  purchase_uom: '',
  sale_uom: '',
  opening_stock: 0,
  unit_cost: 0,
  reorder_level: 0,
  custom_fields: {} as Record<string, any>,
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const UOM = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'ft', 'box', 'pack', 'dozen', 'unit'];

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customFieldTemplates, setCustomFieldTemplates] = useState<{ name: string; type: string; options?: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogData, setCatalogData] = useState<{ category: string; products: { name: string; default_uom: string; category: string }[] }[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryNameError, setCategoryNameError] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('inventory_onboarded');
  });
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const existingCategoryNames = useMemo(() => new Set(categories.map(c => c.name.toLowerCase())), [categories]);

  const fetchItems = () => {
    setLoading(true);
    setError('');
    fetch('/api/inventory/items')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load inventory'))
      .then(setItems)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
  };

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        if (data.custom_field_templates) {
          setCustomFieldTemplates(data.custom_field_templates);
        }
      }
    } catch {}
  };

  useEffect(() => { fetchItems(); fetchCategories(); fetchCompany(); }, []);

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
    const defaults: Record<string, any> = {};
    for (const t of customFieldTemplates) defaults[t.name] = '';
    setForm({ ...emptyForm, custom_fields: defaults });
    setShowModal(true);
  };

  const openEdit = (i: InventoryItem) => {
    setEditing(i);
    setForm({
      item_name: i.item_name,
      sku: i.sku,
      category: i.category,
      category_id: i.category_id || '',
      unit_of_measure: i.unit_of_measure,
      purchase_uom: i.purchase_uom || '',
      sale_uom: i.sale_uom || '',
      opening_stock: i.opening_stock,
      unit_cost: i.unit_cost,
      reorder_level: i.reorder_level,
      custom_fields: i.custom_fields || {},
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
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              const res = await fetch('/api/catalog');
              if (res.ok) {
                const data = await res.json();
                // Fetch categories to resolve category_id from catalog category strings
                const catRes = await fetch('/api/categories');
                const catData = catRes.ok ? await catRes.json() : { categories: [] };
                const catMap = new Map<string, string>();
                for (const c of catData.categories || []) {
                  if (c.name) catMap.set(c.name.toLowerCase(), c.id);
                }
                // Enrich catalog products with matched category_id
                const enriched = (data.categories || []).map((g: any) => ({
                  ...g,
                  products: g.products.map((p: any) => ({
                    ...p,
                    _matchedCatId: catMap.get(p.category.toLowerCase()) || '',
                  })),
                }));
                setCatalogData(enriched);
                setSelectedProducts(new Set());
                setCatalogSearch('');
                setShowCatalog(true);
              }
            } catch {}
          }} className="flex items-center gap-2 px-4 py-2 border border-brand text-brand rounded-lg text-sm font-medium hover:bg-brand/5 transition-colors">
            Browse Catalog
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
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
      ) : filteredItems.length === 0 && items.length === 0 && showOnboarding ? (
        <InventoryOnboarding
          onAddItem={() => {
            localStorage.setItem('inventory_onboarded', 'true');
            setShowOnboarding(false);
            setShowModal(true);
          }}
          onDismiss={() => {
            localStorage.setItem('inventory_onboarded', 'true');
            setShowOnboarding(false);
          }}
        />
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
                  <th className="text-right px-4 py-3 font-medium">Current Stock</th>
                  <th className="text-right px-4 py-3 font-medium">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Total Value</th>
                  <th className="text-right px-4 py-3 font-medium">Reorder&nbsp;Lvl</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`border-b border-border/50 text-[#000000] ${item.reorder_level > 0 && item.current_stock <= item.reorder_level ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {item.item_name}
                          {item.reorder_level > 0 && item.current_stock <= item.reorder_level && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.sku || '—'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-brand/10 text-brand">{item.category || 'Uncategorized'}</span></td>
                      <td className="px-4 py-3 text-right font-medium">{item.current_stock} {item.unit_of_measure}</td>
                      <td className="px-4 py-3 text-right">{fmtKES(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtKES((item.current_stock || 0) * (item.unit_cost || 0))}</td>
                      <td className="px-4 py-3 text-right">
                        {item.reorder_level > 0 ? (
                          <span className={`text-xs font-medium ${item.current_stock <= item.reorder_level ? 'text-red-600' : 'text-gray-500'}`}>
                            {item.reorder_level}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
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
          { key: 'current_stock', label: 'Current Stock' },
          { key: 'reorder_level', label: 'Reorder Level' },
          { key: 'unit_cost', label: 'Unit Cost' },
          { key: 'total_value', label: 'Total Value' },
        ];
        const invData = filteredItems.map(r => ({ ...r, opening_stock: String(r.opening_stock), current_stock: String(r.current_stock), reorder_level: String(r.reorder_level), unit_cost: fmtKES(r.unit_cost), total_value: fmtKES((r.current_stock || 0) * (r.unit_cost || 0)) }));
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
                <label className="block text-xs font-medium text-[#000000] mb-1">Item Name<FieldTooltip text="The name of the product you sell (e.g., Coca-Cola 500ml, Unga 2kg)" /></label>
                <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">SKU<FieldTooltip text="Your internal product code. Leave blank to auto-generate one." /></label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Category<FieldTooltip text="Group similar products (e.g., Beverages, Snacks, Cleaning). Used for reports." /></label>
                  <div className="flex gap-2">
                    <select value={form.category_id} onChange={e => {
                      const catId = e.target.value;
                      const cat = categories.find(c => c.id === catId);
                      setForm({ ...form, category_id: catId, category: cat?.name || '' });
                    }} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                      <option value="">Select category</option>
                      {categories.filter(c => !c.parent_id).length > 0 ? (
                        categories.filter(c => !c.parent_id).map(parent => (
                          <optgroup key={parent.id} label={parent.name}>
                            {categories.filter(ch => ch.parent_id === parent.id).map(child => (
                              <option key={child.id} value={child.id}>— {child.name}</option>
                            ))}
                            <option value={parent.id}>{parent.name} (root)</option>
                          </optgroup>
                        ))
                      ) : (
                        categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      )}
                    </select>
                    {!showCategoryInput ? (
                      <button type="button" onClick={() => { setShowCategoryInput(true); setNewCategoryName(''); setCategoryNameError(''); }}
                        className="px-2.5 py-2 border border-border rounded-lg text-sm text-brand hover:bg-brand/5 transition-colors" title="Add new category">+</button>
                    ) : null}
                  </div>
                  {!showCategoryInput && categories.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Choose an existing category or click + to create a new one.</p>
                  )}
                  {showCategoryInput && (
                    <div className="mt-2 p-3 border border-border rounded-lg bg-gray-50 space-y-2">
                      <div className="flex gap-2">
                        <input autoFocus value={newCategoryName} onChange={e => {
                          const val = e.target.value;
                          setNewCategoryName(val);
                          const trimmed = val.trim().toLowerCase();
                          if (trimmed && existingCategoryNames.has(trimmed)) {
                            setCategoryNameError(`"${val.trim()}" already exists. Please select it instead of adding again.`);
                          } else {
                            setCategoryNameError('');
                          }
                        }} placeholder="Enter category name..."
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white ${categoryNameError ? 'border-red-400 bg-red-50' : 'border-border'}`} />
                        <button type="button" disabled={addingCategory || !newCategoryName.trim() || !!categoryNameError}
                          onClick={async () => {
                            if (!newCategoryName.trim() || categoryNameError) return;
                            setAddingCategory(true);
                            try {
                              const res = await fetch('/api/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newCategoryName.trim() }),
                              });
                              if (res.ok) {
                                await fetchCategories();
                                setShowCategoryInput(false);
                                setNewCategoryName('');
                                setCategoryNameError('');
                              } else {
                                const data = await res.json();
                                toast(data.error || 'Failed to add category');
                              }
                            } catch {
                              toast('Failed to add category');
                            } finally { setAddingCategory(false); }
                          }}
                          className="px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                          {addingCategory ? '...' : 'Add'}
                        </button>
                        <button type="button" onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); setCategoryNameError(''); }}
                          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                      {categoryNameError && (
                        <p className="text-xs text-red-600">{categoryNameError}</p>
                      )}
                      {!categoryNameError && newCategoryName.trim() && !existingCategoryNames.has(newCategoryName.trim().toLowerCase()) && (
                        <p className="text-xs text-green-600">New category — will be created.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Purchase UOM<FieldTooltip text="The unit you buy from suppliers. Leave blank if same as base unit." /></label>
                  <select value={form.purchase_uom} onChange={e => setForm({ ...form, purchase_uom: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    <option value="">Same as base</option>
                    {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Sale UOM<FieldTooltip text="The unit you sell to customers. Leave blank if same as base unit." /></label>
                  <select value={form.sale_uom} onChange={e => setForm({ ...form, sale_uom: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    <option value="">Same as base</option>
                    {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Unit of Measure<FieldTooltip text="How you count this item — pieces (pcs), kilograms (kg), litres (L), boxes." /></label>
                  <select value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white">
                    {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Unit Cost<FieldTooltip text="How much you paid per unit. Used to calculate profit and total inventory value." /></label>
                  <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                </div>
              </div>

              {customFieldTemplates.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Fields</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFieldTemplates.map((f, i) => (
                      <div key={i}>
                        <label className="block text-xs font-medium text-[#000000] mb-1">{f.name}</label>
                        {f.type === 'date' ? (
                          <input type="date" value={form.custom_fields[f.name] || ''} onChange={e => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.name]: e.target.value } })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                        ) : f.type === 'number' ? (
                          <input type="number" value={form.custom_fields[f.name] || ''} onChange={e => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.name]: Number(e.target.value) } })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                        ) : (
                          <input value={form.custom_fields[f.name] || ''} onChange={e => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.name]: e.target.value } })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Opening Stock<FieldTooltip text="Current quantity available in your store. Updated automatically with sales &amp; purchases." /></label>
                <input type="number" value={form.opening_stock} onChange={e => setForm({ ...form, opening_stock: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Reorder Level <span className="text-gray-400 font-normal">(0 = no alert)</span><FieldTooltip text="Get a low stock warning when stock reaches this number. Set to 0 for no alert." /></label>
                <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: Number(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[#000000] bg-white" />
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
      {showCatalog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCatalog(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#000000]">Product Catalog</h2>
              <button onClick={() => setShowCatalog(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search products..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-[#000000] bg-white" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {catalogData.map(group => {
                const filtered = group.products.filter(p =>
                  !catalogSearch || p.name.toLowerCase().includes(catalogSearch.toLowerCase())
                );
                if (filtered.length === 0) return null;
                return (
                  <div key={group.category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filtered.map(p => {
                        const key = `${group.category}::${p.name}`;
                        const checked = selectedProducts.has(key);
                        return (
                          <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${checked ? 'border-brand bg-brand/5' : 'border-border hover:border-gray-300'}`}>
                            <input type="checkbox" checked={checked} onChange={() => {
                              const next = new Set(selectedProducts);
                              if (checked) next.delete(key); else next.add(key);
                              setSelectedProducts(next);
                            }} className="rounded border-gray-300 text-brand focus:ring-brand" />
                            <span className="text-[#000000]">{p.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{p.default_uom}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {catalogData.every(g => g.products.filter(p => !catalogSearch || p.name.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0) && (
                <p className="text-center text-gray-400 py-8 text-sm">No products match your search.</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <span className="text-sm text-gray-500">{selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowCatalog(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={async () => {
                  if (selectedProducts.size === 0) return;
                  setCatalogSaving(true);
                  const payload: any[] = [];
                  for (const key of selectedProducts) {
                    const [, name] = key.split('::');
                    const product = catalogData.flatMap(g => g.products).find(p => p.name === name);
                    if (product) {
                      payload.push({
                        item_name: product.name,
                        sku: '',
                        category: product.category,
                        category_id: (product as any)._matchedCatId || '',
                        unit_of_measure: product.default_uom,
                        purchase_uom: '',
                        sale_uom: '',
                        opening_stock: 0,
                        unit_cost: 0,
                        reorder_level: 0,
                        custom_fields: {},
                      });
                    }
                  }
                  try {
                    const res = await fetch('/api/inventory/items/bulk', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items: payload }),
                    });
                    const result = res.ok ? await res.json() : { added: 0 };
                    setCatalogSaving(false);
                    setShowCatalog(false);
                    fetchItems();
                    toast(`Added ${result.added || payload.length} product${payload.length !== 1 ? 's' : ''} to inventory`);
                  } catch {
                    setCatalogSaving(false);
                    toast('Failed to add products');
                  }
                }} disabled={selectedProducts.size === 0 || catalogSaving}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {catalogSaving ? `Adding ${selectedProducts.size}...` : `Add Selected (${selectedProducts.size})`}
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
