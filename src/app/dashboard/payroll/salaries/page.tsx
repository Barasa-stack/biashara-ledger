'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, DollarSign } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type Salary = {
  id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  pay_date: string;
  payment_method: string;
  payslip_reference: string;
  status: string;
  created_at: string;
};

type Employee = {
  id: string;
  name: string;
  employee_code: string;
};

const emptyForm = {
  employee_id: '',
  amount: 0,
  pay_date: new Date().toISOString().split('T')[0],
  payment_method: 'Bank Transfer',
  payslip_reference: '',
  status: 'pending',
};

const fmtUSD = (n: number | string | null | undefined) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Mobile Money'];
const STATUSES = ['paid', 'pending'];

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchSalaries = () => {
    setLoading(true);
    setError('');
    fetch('/api/payroll/salaries')
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load salaries (${r.status})`);
        }
        return r.json();
      })
      .then(setSalaries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchEmployees = () =>
    fetch('/api/payroll')
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          console.warn('Failed to load employees for dropdown:', body.error || r.status);
          return [];
        }
        return r.json();
      })
      .then(setEmployees)
      .catch(() => {});

  useEffect(() => { fetchSalaries(); fetchEmployees(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Salary) => {
    setEditing(s);
    setForm({
      employee_id: s.employee_id,
      amount: s.amount,
      pay_date: s.pay_date?.split('T')[0] || '',
      payment_method: s.payment_method,
      payslip_reference: s.payslip_reference,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/payroll/salaries';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save salary');
      setShowModal(false);
      fetchSalaries();
    } catch (e: any) {
      toast(e.message || 'Error saving salary');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Salary) => {
    if (!await confirm(`Delete salary record for "${s.employee_name}"?`)) return;
    try {
      const res = await fetch('/api/payroll/salaries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchSalaries();
    } catch (e: any) {
      toast(e.message || 'Error deleting salary');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load salaries</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchSalaries} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <DollarSign className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Salaries</h1>
            <p className="text-xs text-gray-500">Process and manage employee salaries</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Process Salary
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading salaries...</span>
            </div>
          </div>
        ) : salaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <DollarSign className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No salaries processed yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Process First Salary
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Employee</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Pay Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reference</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salaries.map((s, i) => (
                  <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{salaries.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{s.employee_name || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-800">{fmtUSD(s.amount)}</td>
                    <td className="py-3 pr-4 text-gray-700">{s.pay_date ? new Date(s.pay_date).toLocaleDateString('en-US') : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        s.status === 'paid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{s.payslip_reference || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Salary' : 'Process Salary'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Employee</label>
                <select
                  value={form.employee_id}
                  onChange={e => set('employee_id')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                    <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}{emp.employee_code ? ` (${emp.employee_code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Amount (USD)" value={String(form.amount)} onChange={v => set('amount')(Number(v) || 0)} type="number" />
                <Field label="Pay Date" value={form.pay_date} onChange={set('pay_date')} type="date" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={e => set('payment_method')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Payslip Reference" value={form.payslip_reference} onChange={set('payslip_reference')} />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.employee_id}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Salary' : 'Process Salary'
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

function Field({ label, value, onChange, type, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
