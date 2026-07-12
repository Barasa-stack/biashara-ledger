'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, X, FileText, Download, Mail, Search, Calculator, Printer } from 'lucide-react';
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
  overtime_hours: number;
  overtime_type: string;
  bonuses: number;
  gross_pay: number;
  nssf_employee: number;
  nhif: number;
  shif: number;
  ahl: number;
  paye: number;
  employer_nssf: number;
  employer_ahl: number;
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
  const [showGenerate, setShowGenerate] = useState(false);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [selectedSalaryId, setSelectedSalaryId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [emailModal, setEmailModal] = useState<{ payslip: Payslip; employee: any } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
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

  useEffect(() => {
    fetchPayslips();
    fetch('/api/payroll/salaries').then(r => r.json()).then(setSalaries).catch(() => {});
    fetch('/api/payroll').then(r => r.json()).then(setEmployees).catch(() => {});
  }, []);

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

  const handleGenerate = async () => {
    if (!selectedSalaryId) return;
    setGenerating(true);
    try {
      const s = salaries.find(s => s.id === selectedSalaryId);
      if (!s) throw new Error('Salary not found');
      const calcRes = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basic_salary: s.basic_salary, allowances: s.allowances, deductions: s.deductions, overtime: s.overtime, bonuses: s.bonuses }),
      });
      if (!calcRes.ok) throw new Error('Calculation failed');
      const calc = await calcRes.json();
      const ref = `PSL-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch('/api/payroll/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary_id: s.id,
          employee_id: s.employee_id,
          employee_name: s.employee_name,
          payslip_reference: ref,
          basic_salary: s.basic_salary,
          allowances: s.allowances,
          deductions: calc.other_deductions || 0,
          overtime: s.overtime,
          overtime_hours: calc.overtime_hours || 0,
          overtime_type: calc.overtime_type || 'none',
          bonuses: s.bonuses,
          gross_pay: calc.gross_pay,
          nssf_employee: calc.nssf_employee,
          nhif: calc.nhif,
          shif: calc.shif || 0,
          ahl: calc.ahl || 0,
          paye: calc.paye,
          employer_nssf: calc.employer_nssf,
          employer_ahl: calc.employer_ahl || 0,
          net_pay: calc.net_pay,
          pay_date: s.pay_date,
          payment_method: s.payment_method,
          period_start: s.pay_date,
          period_end: s.pay_date,
          status: 'generated',
        }),
      });
      if (!res.ok) throw new Error('Failed to generate payslip');
      toast('Payslip generated successfully');
      setShowGenerate(false);
      setSelectedSalaryId('');
      fetchPayslips();
    } catch (e: any) {
      toast(e.message || 'Error generating payslip');
    } finally {
      setGenerating(false);
    }
  };

  const handleEmail = (p: Payslip) => {
    const emp = employees.find(e => String(e.id) === String(p.employee_id));
    if (!emp) { toast('Employee record not found'); return; }
    if (!emp.email) { toast('No email address on file for this employee'); return; }
    setEmailModal({ payslip: p, employee: emp });
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/payroll/payslips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailModal.payslip.id, action: 'send_email' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      toast(`Payslip emailed to ${data.name} at ${data.to}`);
      setEmailModal(null);
      fetchPayslips();
    } catch (e: any) {
      toast(e.message || 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = (p: Payslip) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const nssfTier1 = Math.min((p.gross_pay||0), 9000) * 0.06;
    const nssfTier2 = Math.max(0, Math.min((p.gross_pay||0) - 9000, 108000 - 9000)) * 0.06;
    w.document.write(`<html><head><title>Payslip — ${p.employee_name}</title>
      <style>
        body{font-family:'Courier New',monospace;padding:40px;max-width:700px;margin:auto}
        h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;color:#555;margin:0 0 20px}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
        th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #ddd}
        .r{text-align:right}.b{font-weight:bold}.red{color:#c00}.green{color:#080}
        .section-title{font-weight:bold;font-size:13px;margin-top:16px;margin-bottom:4px}
      </style></head><body>
      <h1>${p.employee_name}</h1>
      <h2>${p.payslip_reference} — ${fmtDate(p.pay_date)}</h2>
      <table>
        <tr><th colspan="2">Earnings</th></tr>
        <tr><td>Basic Salary</td><td class="r">${fmtKES(p.basic_salary)}</td></tr>
        <tr><td>Allowances</td><td class="r">${fmtKES(p.allowances)}</td></tr>
        <tr><td>Overtime ${p.overtime_hours ? '('+p.overtime_hours+'h '+(p.overtime_type==='rest_day'?'×2.0':'×1.5')+')' : ''}</td><td class="r">${fmtKES(p.overtime)}</td></tr>
        <tr><td>Bonuses</td><td class="r">${fmtKES(p.bonuses)}</td></tr>
        <tr class="b"><td>Gross Pay</td><td class="r">${fmtKES(p.gross_pay)}</td></tr>
      </table>
      <table>
        <tr><th colspan="2" class="red">Deductions</th></tr>
        <tr><td>PAYE (Income Tax)</td><td class="r red">-${fmtKES(p.paye)}</td></tr>
        <tr><td>NSSF Tier I (first 9,000)</td><td class="r red">-${fmtKES(nssfTier1)}</td></tr>
        <tr><td>NSSF Tier II (9,001–108,000)</td><td class="r red">-${fmtKES(nssfTier2)}</td></tr>
        <tr><td>SHIF (2.75%)</td><td class="r red">-${fmtKES(p.shif || p.nhif)}</td></tr>
        <tr><td>AHL (1.5%)</td><td class="r red">-${fmtKES(p.ahl)}</td></tr>
        <tr><td>Other Deductions</td><td class="r red">-${fmtKES(p.deductions)}</td></tr>
        <tr class="b green"><td>Net Pay</td><td class="r">${fmtKES(p.net_pay)}</td></tr>
      </table>
      <table>
        <tr><th colspan="2">Employer Contributions</th></tr>
        <tr><td>NSSF (Tier I + II)</td><td class="r">${fmtKES(p.employer_nssf)}</td></tr>
        <tr><td>AHL (1.5%)</td><td class="r">${fmtKES(p.employer_ahl)}</td></tr>
      </table>
      <p style="font-size:11px;color:#999;margin-top:24px">Payment: ${p.payment_method} | Period: ${fmtDate(p.period_start)} — ${fmtDate(p.period_end)}</p>
    </body></html>`);
    w.document.close();
    w.print();
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
          <button onClick={() => { setSelectedSalaryId(''); setShowGenerate(true); }} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
            <Plus className="h-4 w-4" />
            Generate Payslip
          </button>
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
                        <button onClick={e => { e.stopPropagation(); handleEmail(p); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Email Payslip to Employee"><Mail className="h-4 w-4" /></button>
                        <button onClick={e => { e.stopPropagation(); handlePrint(p); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Print Payslip"><Printer className="h-4 w-4" /></button>
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
                    <span className="text-gray-500">Overtime {selected.overtime_hours ? `(${selected.overtime_hours}h ${selected.overtime_type === 'rest_day' ? '×2.0' : '×1.5'})` : ''}</span><span className="text-right font-medium">{fmtKES(selected.overtime)}</span>
                    <span className="text-gray-500">Bonuses</span><span className="text-right font-medium">{fmtKES(selected.bonuses)}</span>
                  </div>
                  <div className="border-t pt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                    <span className="font-semibold text-gray-700">Gross Pay</span><span className="text-right font-bold">{fmtKES(selected.gross_pay)}</span>
                  </div>
                  <div className="border-t pt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-red-600">
                    <span>PAYE (Income Tax)</span><span className="text-right">-{fmtKES(selected.paye)}</span>
                    <span>SHIF (2.75%)</span><span className="text-right">-{fmtKES(selected.shif || selected.nhif)}</span>
                    <span>NSSF Tier I (first 9,000)</span><span className="text-right">-{fmtKES(Math.min((selected.gross_pay||0),9000)*0.06)}</span>
                    <span>NSSF Tier II (9,001–108,000)</span><span className="text-right">-{fmtKES(Math.max(0,Math.min((selected.gross_pay||0)-9000,108000-9000))*0.06)}</span>
                    <span>AHL (1.5%)</span><span className="text-right">-{fmtKES(selected.ahl)}</span>
                    <span>Other Deductions</span><span className="text-right">-{fmtKES(selected.deductions)}</span>
                  </div>
                  <div className="border-t-2 pt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-green-700">
                    <span className="font-bold text-base">Net Pay</span><span className="text-right font-bold text-base">{fmtKES(selected.net_pay)}</span>
                  </div>
                  <div className="border-t pt-3 mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                    <span>Payment Method</span><span className="text-right">{selected.payment_method}</span>
                    <span>Pay Date</span><span className="text-right">{fmtDate(selected.pay_date)}</span>
                    <span>Employer NSSF (Tier I + II)</span><span className="text-right">{fmtKES(selected.employer_nssf)}</span>
                    <span>Employer AHL</span><span className="text-right">{fmtKES(selected.employer_ahl)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={() => handleEmail(selected)} className="inline-flex items-center gap-1.5 bg-brand/5 text-brand text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand/10 transition-colors">
                  <Mail className="h-4 w-4" /> Email Payslip to Employee
                </button>
                <button onClick={() => setSelected(null)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">Generate Payslip</h2>
              <button onClick={() => setShowGenerate(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Select Salary</label>
                <select value={selectedSalaryId} onChange={e => setSelectedSalaryId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  <option value="">Choose a salary record...</option>
                  {salaries.filter(s => s.status === 'paid' || s.status === 'pending').map(s => (
                    <option key={s.id} value={s.id}>{s.employee_name} — KSh {Number(s.amount || 0).toLocaleString()} ({s.status})</option>
                  ))}
                </select>
                {salaries.length === 0 && <p className="text-xs text-gray-400 mt-1">No salaries found. Process a salary first.</p>}
              </div>
              <button onClick={handleGenerate} disabled={generating || !selectedSalaryId}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {generating ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Generating...</>
                ) : (
                  <><Calculator className="h-4 w-4" /> Generate Payslip</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Send Payslip</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Employee</span>
                <span className="font-medium text-gray-800">{emailModal.employee.name}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800">{emailModal.employee.email}</span>
              </div>
              {emailModal.employee.phone && (
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-800">{emailModal.employee.phone}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Payslip</span>
                <span className="font-medium text-gray-800">{emailModal.payslip.payslip_reference}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Net Pay</span>
                <span className="font-semibold text-green-700">{fmtKES(emailModal.payslip.net_pay)}</span>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 text-center">
                This will email the payslip details to{' '}<strong>{emailModal.employee.email}</strong>.
                Make sure the employee details are correct.
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button
                onClick={() => setEmailModal(null)}
                disabled={sendingEmail}
                className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {sendingEmail ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Sending...</>
                ) : (
                  'Confirm Send'
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
