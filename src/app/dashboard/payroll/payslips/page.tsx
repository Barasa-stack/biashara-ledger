'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, X, FileText, Download, Mail, Search } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type Payslip = {
  id: string;
  salary_id: string;
  employee_id: string;
  employee_name: string;
  payslip_reference: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
  gross_pay: number;
  nssf_employee: number;
  nhif: number;
  paye: number;
  employer_nssf: number;
  net_pay: number;
  pay_date: string;
  payment_method: string;
  period_start: string;
  period_end: string;
  status: string;
  emailed: number;
  created_at: string;
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US') : '—';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Payslip | null>(null);
  const [search, setSearch] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchPayslips = () => {
    setLoading(true);
    setError('');
    fetch('/api/payroll/payslips')
      .then(async r => {
        if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || `Failed (${r.status})`); }
        return r.json();
      })
      .then(setPayslips)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayslips(); }, []);

  const filtered = useMemo(() => {
    if (!search) return payslips;
    const q = search.toLowerCase();
    return payslips.filter(p => p.employee_name?.toLowerCase().includes(q) || p.payslip_reference?.toLowerCase().includes(q));
  }, [payslips, search]);

  const handleDelete = async (p: Payslip) => {
    if (!await confirm(`Delete payslip "${p.payslip_reference}"?`)) return;
    try {
      const res = await fetch('/api/payroll/payslips', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPayslips();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const handleEmail = async (p: Payslip) => {
    try {
      const res = await fetch('/api/payroll/payslips', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, action: 'mark_emailed' }) });
      if (!res.ok) throw new Error('Failed');
      toast('Payslip marked as emailed');
      fetchPayslips();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-brand font-medium mb-2">Failed to load payslips</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={fetchPayslips} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Payslips</h1>
            <p className="text-xs text-gray-500">View and manage employee payslips</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 max-w-xs">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search payslips..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /><span className="text-sm text-gray-600">Loading payslips...</span></div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No payslips generated yet</p>
            <p className="text-xs text-gray-400">Process salaries first to generate payslips automatically</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reference</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Employee</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Gross Pay</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Deductions</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Net Pay</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Pay Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors cursor-pointer" onClick={() => setSelected(p)}>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-700">{p.payslip_reference || '—'}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{p.employee_name}</td>
                    <td className="py-3 pr-4 text-right text-gray-800">{fmtKES(p.gross_pay)}</td>
                    <td className="py-3 pr-4 text-right text-red-600">{fmtKES((p.nssf_employee || 0) + (p.nhif || 0) + (p.paye || 0))}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-green-700">{fmtKES(p.net_pay)}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(p.pay_date)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                      {p.emailed ? <span className="ml-1 text-xs text-blue-600">✉</span> : null}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); handleEmail(p); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Mark as Emailed"><Mail className="h-4 w-4" /></button>
                        <button onClick={e => { e.stopPropagation(); setSelected(p); }} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="View"><Download className="h-4 w-4" /></button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(p); }} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">Payslip — {selected.payslip_reference}</h2>
              <button onClick={() => setSelected(null)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b border-border">
                  <h3 className="text-lg font-bold text-gray-800">{selected.employee_name}</h3>
                  <p className="text-sm text-gray-500">Ref: {selected.payslip_reference} | Period: {selected.period_start ? fmtDate(selected.period_start) : '—'} — {selected.period_end ? fmtDate(selected.period_end) : '—'}</p>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <span className="text-gray-500">Basic Salary</span><span className="text-right font-medium">{fmtKES(selected.basic_salary)}</span>
                    <span className="text-gray-500">Allowances</span><span className="text-right font-medium">{fmtKES(selected.allowances)}</span>
                    <span className="text-gray-500">Overtime</span><span className="text-right font-medium">{fmtKES(selected.overtime)}</span>
                    <span className="text-gray-500">Bonuses</span><span className="text-right font-medium">{fmtKES(selected.bonuses)}</span>
                  </div>
                  <div className="border-t pt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                    <span className="font-semibold text-gray-700">Gross Pay</span><span className="text-right font-bold">{fmtKES(selected.gross_pay)}</span>
                  </div>
                  <div className="border-t pt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-red-600">
                    <span>PAYE (Income Tax)</span><span className="text-right">-{fmtKES(selected.paye)}</span>
                    <span>NSSF (Employee)</span><span className="text-right">-{fmtKES(selected.nssf_employee)}</span>
                    <span>NHIF</span><span className="text-right">-{fmtKES(selected.nhif)}</span>
                    <span>Other Deductions</span><span className="text-right">-{fmtKES(selected.deductions)}</span>
                  </div>
                  <div className="border-t-2 pt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-green-700">
                    <span className="font-bold text-base">Net Pay</span><span className="text-right font-bold text-base">{fmtKES(selected.net_pay)}</span>
                  </div>
                  <div className="border-t pt-3 mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                    <span>Payment Method</span><span className="text-right">{selected.payment_method}</span>
                    <span>Pay Date</span><span className="text-right">{fmtDate(selected.pay_date)}</span>
                    <span>Employer NSSF</span><span className="text-right">{fmtKES(selected.employer_nssf)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={() => handleEmail(selected)} className="inline-flex items-center gap-1.5 bg-brand/5 text-brand text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand/10 transition-colors">
                  <Mail className="h-4 w-4" /> Mark as Emailed
                </button>
                <button onClick={() => setSelected(null)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
