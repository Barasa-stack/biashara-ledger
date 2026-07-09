'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, DollarSign, Calculator } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type Salary = {
  id: string;
  employee_id: string;
  employee_name: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
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

type DeductionBreakdown = {
  basic_salary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  gross_pay: number;
  nssf_employee: number;
  nhif: number;
  paye: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  employer_nssf: number;
};

const emptyForm = {
  employee_id: '',
  basic_salary: 0,
  allowances: 0,
  deductions: 0,
  overtime: 0,
  bonuses: 0,
  amount: 0,
  pay_date: new Date().toISOString().split('T')[0],
  payment_method: 'Bank Transfer',
  payslip_reference: '',
  status: 'pending',
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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
  const [computed, setComputed] = useState<DeductionBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
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
    setComputed(null);
    setShowBreakdown(false);
    setShowModal(true);
  };

  const openEdit = (s: Salary) => {
    setEditing(s);
    setForm({
      employee_id: s.employee_id,
      basic_salary: s.basic_salary,
      allowances: s.allowances,
      deductions: s.deductions,
      overtime: s.overtime,
      bonuses: s.bonuses,
      amount: s.amount,
      pay_date: s.pay_date?.split('T')[0] || '',
      payment_method: s.payment_method,
      payslip_reference: s.payslip_reference,
      status: s.status,
    });
    setComputed(null);
    setShowBreakdown(false);
    setShowModal(true);
  };

  const computeBreakdown = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basic_salary: form.basic_salary,
          allowances: form.allowances,
          deductions: form.deductions,
          overtime: form.overtime,
          bonuses: form.bonuses,
        }),
      });
      if (!res.ok) throw new Error('Calculation failed');
      const data: DeductionBreakdown = await res.json();
      setComputed(data);
      setForm(prev => ({ ...prev, amount: data.net_pay }));
      setShowBreakdown(true);
    } catch (e: any) {
      toast(e.message || 'Error calculating');
    } finally {
      setCalculating(false);
    }
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

  const totals = useMemo(() => {
    const paid = salaries.filter(s => s.status === 'paid');
    return {
      totalPaid: paid.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      totalPending: salaries.filter(s => s.status !== 'paid').reduce((sum, s) => sum + Number(s.amount || 0), 0),
      count: salaries.length,
    };
  }, [salaries]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load salaries</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchSalaries} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Paid</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{fmtKES(totals.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Pending</p>
          <p className="text-xl font-bold text-yellow-700 mt-1">{fmtKES(totals.totalPending)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Records</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{totals.count}</p>
        </div>
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
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Basic</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Allowances</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Deductions</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Net Pay</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salaries.map((s, i) => (
                  <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{salaries.length - i}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{s.employee_name || '—'}</td>
                    <td className="py-3 pr-4 text-right text-gray-800">{fmtKES(s.basic_salary)}</td>
                    <td className="py-3 pr-4 text-right text-gray-800">{fmtKES(s.allowances)}</td>
                    <td className="py-3 pr-4 text-right text-gray-800">{fmtKES(s.deductions)}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-800">{fmtKES(s.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
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
          <div className="bg-white rounded-lg border border-border w-full max-w-xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Salary' : 'Process Salary'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
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
                <Field label="Basic Salary (KES)" value={String(form.basic_salary)} onChange={v => set('basic_salary')(Number(v) || 0)} type="number" />
                <Field label="Allowances (KES)" value={String(form.allowances)} onChange={v => set('allowances')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Deductions (KES)" value={String(form.deductions)} onChange={v => set('deductions')(Number(v) || 0)} type="number" />
                <Field label="Overtime (KES)" value={String(form.overtime)} onChange={v => set('overtime')(Number(v) || 0)} type="number" />
              </div>
              <Field label="Bonuses (KES)" value={String(form.bonuses)} onChange={v => set('bonuses')(Number(v) || 0)} type="number" />

              <button
                onClick={computeBreakdown}
                disabled={calculating}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand/5 text-brand text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand/10 transition-colors"
              >
                <Calculator className="h-4 w-4" />
                {calculating ? 'Calculating...' : 'Auto-Calculate Net Pay'}
              </button>

              {showBreakdown && computed && (
                <div className="bg-gray-50 rounded-lg border border-border p-4 space-y-2 text-sm">
                  <h3 className="font-semibold text-gray-800 mb-2">Salary Breakdown</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-gray-500">Gross Pay:</span><span className="text-right font-medium">{fmtKES(computed.gross_pay)}</span>
                    <span className="text-gray-500">PAYE (Income Tax):</span><span className="text-right text-red-600">-{fmtKES(computed.paye)}</span>
                    <span className="text-gray-500">NSSF (Employee):</span><span className="text-right text-red-600">-{fmtKES(computed.nssf_employee)}</span>
                    <span className="text-gray-500">NHIF:</span><span className="text-right text-red-600">-{fmtKES(computed.nhif)}</span>
                    <span className="text-gray-500">Other Deductions:</span><span className="text-right text-red-600">-{fmtKES(computed.other_deductions)}</span>
                    <span className="text-gray-500 border-t pt-1 font-semibold">Net Pay:</span><span className="text-right border-t pt-1 font-bold text-green-700">{fmtKES(computed.net_pay)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Employer NSSF contribution: {fmtKES(computed.employer_nssf)}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Pay Date" value={form.pay_date} onChange={set('pay_date')} type="date" />
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Field label="Payslip Reference" value={form.payslip_reference} onChange={set('payslip_reference')} />
              </div>
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
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
    </div>
  );
}
