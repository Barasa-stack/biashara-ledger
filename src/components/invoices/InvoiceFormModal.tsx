'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getVatRate } from '@/lib/vat-rates';
import SearchableCountrySelect from '@/components/SearchableCountrySelect';
import { fetchNextInvoiceNumber, saveInvoice } from '@/lib/api/invoices';
import { Customer, Quotation, LineItem, InvoiceForm, Invoice, emptyForm, STATUSES, PAYMENT_TERMS } from '@/types/invoices';
import { Field } from './Field';

type Props = {
  open: boolean;
  editing: Invoice | null;
  customers: Customer[];
  quotations: Quotation[];
  vatRate: number;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
};

export function InvoiceFormModal({ open, editing, customers, quotations, vatRate, onClose, onSaved, showToast }: Props) {
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      let items: LineItem[] = [];
      try {
        const parsed = typeof editing.items === 'string' ? JSON.parse(editing.items) : editing.items;
        items = Array.isArray(parsed) ? parsed : [];
      } catch {}
      setLineItems(items);
      setForm(recalc({
        invoice_number: editing.invoice_number,
        customer_id: editing.customer_id,
        customer_name: editing.customer_name,
        description: editing.description,
        quantity: editing.quantity,
        unit_price: editing.unit_price,
        subtotal: editing.subtotal,
        tax_vat: editing.tax_vat,
        discounts: editing.discounts,
        amount: editing.amount,
        payment_terms: editing.payment_terms,
        status: editing.status,
        issue_date: editing.issue_date?.split('T')[0] || '',
        due_date: editing.due_date?.split('T')[0] || '',
        customer_country: editing.customer_country || '',
        vat_rate: editing.vat_rate ?? (editing.customer_country ? getVatRate(editing.customer_country).rate : vatRate),
        quotation_id: editing.quotation_id || '',
      }, items));
    } else {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setLineItems([]);
      fetchNextInvoiceNumber().then(nextNumber => {
        setForm(recalc({ ...emptyForm, invoice_number: nextNumber, issue_date: today, due_date: due }));
      });
    }
  }, [open]);

  const recalc = (f: InvoiceForm, items?: LineItem[]) => {
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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = field === 'customer_id' ? e.target.value : (field === 'quantity' || field === 'unit_price' || field === 'subtotal' || field === 'tax_vat' || field === 'discounts' || field === 'amount' ? Number(e.target.value) : e.target.value);
    setForm(prev => recalc({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveInvoice(form, lineItems, editing);
      onClose();
      onSaved();
      showToast(editing ? 'Invoice updated' : 'Invoice created', 'success');
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeVatLabel = (() => {
    const rate = form.vat_rate ?? (form.customer_country ? getVatRate(form.customer_country).rate : vatRate);
    if (rate === 0) return 'VAT (0%)';
    return `VAT (${rate}%)`;
  })();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-800">
            {editing ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button
            onClick={onClose}
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
            onClick={onClose}
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
  );
}

const fmtKES = (n: number) =>
  `KSh ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
