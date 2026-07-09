'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Search } from 'lucide-react';

type PayrollRegisterRow = {
  id: string;
  employee_name: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
  amount: number;
  pay_date: string;
  status: string;
  tax_pin: string;
  national_id: string;
  department: string;
};

type DeductionSummary = {
  total_paye: number;
  total_nssf: number;
  total_nhif: number;
  total_employer_nssf: number;
  total_other_deductions: number;
  count: number;
  total_gross: number;
  total_net: number;
};

type P9Summary = {
  employee_name: string;
  tax_pin: string;
  national_id: string;
  total_gross: number;
  total_paye: number;
  total_nssf: number;
  total_nhif: number;
  total_net: number;
  records: any[];
};

type Employee = {
  id: string;
  name: string;
  employee_code: string;
};

const fmtKES = (n: number | string | null | undefined) =>
  `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US') : '—';

const TABS = [
  { id: 'payroll-register', label: 'Payroll Register' },
  { id: 'deduction-summary', label: 'Deduction Summary' },
  { id: 'p9', label: 'P9 Form' },
];

export default function PayrollReportsPage() {
  const [tab, setTab] = useState('payroll-register');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [register, setRegister] = useState<{ rows: PayrollRegisterRow[]; totalGross: number; totalNet: number; count: number } | null>(null);
  const [deductionSummary, setDeductionSummary] = useState<DeductionSummary | null>(null);
  const [p9Data, setP9Data] = useState<P9Summary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const fetchEmployees = () =>
    fetch('/api/payroll').then(r => r.ok ? r.json() : []).then(setEmployees).catch(() => {});

  useEffect(() => { fetchEmployees(); }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ type: tab });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (tab === 'p9' && selectedEmployee) params.set('employee_id', selectedEmployee);

      const res = await fetch(`/api/payroll/reports?${params}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Failed (${res.status})`); }
      const data = await res.json();

      if (tab === 'payroll-register') setRegister(data);
      else if (tab === 'deduction-summary') setDeductionSummary(data);
      else if (tab === 'p9') setP9Data(data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [tab]);

  const printTable = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Payroll Report</title><style>body{font-family:monospace;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#f5f5f5} .right{text-align:right} h2{margin-bottom:4px}</style></head><body>`);
    w.document.write(`<h2>Payroll Report — ${TABS.find(t => t.id === tab)?.label}</h2>`);
    w.document.write(`<p>Period: ${dateFrom || 'Any'} — ${dateTo || 'Any'}</p>`);
    if (tab === 'payroll-register' && register) {
      w.document.write(`<table><thead><tr><th>Employee</th><th>Department</th><th class="right">Basic</th><th class="right">Allowances</th><th class="right">Deductions</th><th class="right">Net Pay</th><th>Pay Date</th></tr></thead><tbody>`);
      register.rows.forEach(r => {
        w.document.write(`<tr><td>${r.employee_name}</td><td>${r.department || '—'}</td><td class="right">${fmtKES(r.basic_salary)}</td><td class="right">${fmtKES(r.allowances)}</td><td class="right">${fmtKES(r.deductions)}</td><td class="right">${fmtKES(r.amount)}</td><td>${fmtDate(r.pay_date)}</td></tr>`);
      });
      w.document.write(`</tbody></table>`);
      w.document.write(`<p><strong>Total Gross:</strong> ${fmtKES(register.totalGross)} | <strong>Total Net:</strong> ${fmtKES(register.totalNet)} | <strong>Count:</strong> ${register.count}</p>`);
    }
    if (tab === 'deduction-summary' && deductionSummary) {
      w.document.write(`<table><thead><tr><th>Deduction Type</th><th class="right">Amount</th></tr></thead><tbody>`);
      w.document.write(`<tr><td>Total Gross Pay</td><td class="right">${fmtKES(deductionSummary.total_gross)}</td></tr>`);
      w.document.write(`<tr><td>PAYE (Income Tax)</td><td class="right">${fmtKES(deductionSummary.total_paye)}</td></tr>`);
      w.document.write(`<tr><td>NSSF (Employee)</td><td class="right">${fmtKES(deductionSummary.total_nssf)}</td></tr>`);
      w.document.write(`<tr><td>NHIF</td><td class="right">${fmtKES(deductionSummary.total_nhif)}</td></tr>`);
      w.document.write(`<tr><td>Employer NSSF</td><td class="right">${fmtKES(deductionSummary.total_employer_nssf)}</td></tr>`);
      w.document.write(`<tr><td>Other Deductions</td><td class="right">${fmtKES(deductionSummary.total_other_deductions)}</td></tr>`);
      w.document.write(`<tr><td><strong>Total Net Pay</strong></td><td class="right"><strong>${fmtKES(deductionSummary.total_net)}</strong></td></tr>`);
      w.document.write(`</tbody></table>`);
      w.document.write(`<p>Employee Count: ${deductionSummary.count}</p>`);
    }
    if (tab === 'p9' && p9Data) {
      w.document.write(`<h3>Employee: ${p9Data.employee_name}</h3>`);
      w.document.write(`<p>Tax PIN: ${p9Data.tax_pin || '—'} | National ID: ${p9Data.national_id || '—'}</p>`);
      w.document.write(`<table><thead><tr><th>Period</th><th class="right">Gross Pay</th><th class="right">PAYE</th><th class="right">NSSF</th><th class="right">NHIF</th><th class="right">Net Pay</th></tr></thead><tbody>`);
      p9Data.records.forEach((r: any) => {
        w.document.write(`<tr><td>${fmtDate(r.pay_date)}</td><td class="right">${fmtKES(r.gross_pay)}</td><td class="right">${fmtKES(r.paye)}</td><td class="right">${fmtKES(r.nssf_employee)}</td><td class="right">${fmtKES(r.nhif)}</td><td class="right">${fmtKES(r.net_pay)}</td></tr>`);
      });
      w.document.write(`</tbody></table>`);
      w.document.write(`<p><strong>Totals:</strong> Gross: ${fmtKES(p9Data.total_gross)} | PAYE: ${fmtKES(p9Data.total_paye)} | NSSF: ${fmtKES(p9Data.total_nssf)} | NHIF: ${fmtKES(p9Data.total_nhif)} | Net: ${fmtKES(p9Data.total_net)}</p>`);
    }
    w.document.write(`</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Payroll Reports</h1>
            <p className="text-xs text-gray-500">Payroll summaries, tax filings, and audits</p>
          </div>
        </div>
        <button onClick={printTable} className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors">
          <Download className="h-4 w-4" /> Print Report
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border">
        <div className="flex border-b border-border">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setRegister(null); setDeductionSummary(null); setP9Data(null); }}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-brand border-b-2 border-brand' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          {tab === 'p9' && (
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
              <option value="">Select employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          )}
          <button onClick={fetchReport} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-brand-hover transition-colors">
            <Search className="h-3.5 w-3.5" /> Run Report
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /><span className="text-sm text-gray-600">Loading report...</span></div></div>
          ) : error ? (
            <div className="text-center py-8"><p className="text-brand font-medium">{error}</p></div>
          ) : tab === 'payroll-register' && register ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total Gross</p><p className="text-lg font-bold">{fmtKES(register.totalGross)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total Net Pay</p><p className="text-lg font-bold text-green-700">{fmtKES(register.totalNet)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Records</p><p className="text-lg font-bold">{register.count}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Employee</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Department</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Basic</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Allowances</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Deductions</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Net Pay</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Pay Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {register.rows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-surface/50">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">{r.employee_name}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{r.department || '—'}</td>
                        <td className="py-2.5 pr-4 text-right">{fmtKES(r.basic_salary)}</td>
                        <td className="py-2.5 pr-4 text-right">{fmtKES(r.allowances)}</td>
                        <td className="py-2.5 pr-4 text-right text-red-600">-{fmtKES(r.deductions)}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold text-green-700">{fmtKES(r.amount)}</td>
                        <td className="py-2.5 pr-4"><span className={`text-xs font-medium px-2 py-0.5 rounded ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                        <td className="py-2.5 text-gray-600">{fmtDate(r.pay_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : tab === 'deduction-summary' && deductionSummary ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total Gross Pay</p><p className="text-lg font-bold">{fmtKES(deductionSummary.total_gross)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total Net Pay</p><p className="text-lg font-bold text-green-700">{fmtKES(deductionSummary.total_net)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total Deductions</p><p className="text-lg font-bold text-red-700">{fmtKES(deductionSummary.total_paye + deductionSummary.total_nssf + deductionSummary.total_nhif + deductionSummary.total_other_deductions)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Employee Count</p><p className="text-lg font-bold">{deductionSummary.count}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Deduction Type</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-surface/50"><td className="py-2.5 pr-4 text-gray-700">PAYE (Income Tax)</td><td className="py-2.5 text-right font-medium text-red-600">{fmtKES(deductionSummary.total_paye)}</td></tr>
                    <tr className="hover:bg-surface/50"><td className="py-2.5 pr-4 text-gray-700">NSSF (Employee Share)</td><td className="py-2.5 text-right font-medium text-red-600">{fmtKES(deductionSummary.total_nssf)}</td></tr>
                    <tr className="hover:bg-surface/50"><td className="py-2.5 pr-4 text-gray-700">NHIF</td><td className="py-2.5 text-right font-medium text-red-600">{fmtKES(deductionSummary.total_nhif)}</td></tr>
                    <tr className="hover:bg-surface/50"><td className="py-2.5 pr-4 text-gray-700">Employer NSSF (Statutory)</td><td className="py-2.5 text-right font-medium text-orange-600">{fmtKES(deductionSummary.total_employer_nssf)}</td></tr>
                    <tr className="hover:bg-surface/50"><td className="py-2.5 pr-4 text-gray-700">Other Deductions</td><td className="py-2.5 text-right font-medium text-red-600">{fmtKES(deductionSummary.total_other_deductions)}</td></tr>
                    <tr className="hover:bg-surface/50 border-t-2"><td className="py-2.5 pr-4 font-semibold text-gray-800">Total Deductions</td><td className="py-2.5 text-right font-bold text-red-700">{fmtKES(deductionSummary.total_paye + deductionSummary.total_nssf + deductionSummary.total_nhif + deductionSummary.total_other_deductions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : tab === 'p9' && p9Data ? (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800">{p9Data.employee_name}</h3>
                <p className="text-sm text-gray-600">Tax PIN: {p9Data.tax_pin || '—'} | National ID: {p9Data.national_id || '—'}</p>
              </div>
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="bg-white border rounded-lg p-3"><p className="text-xs text-gray-500">Total Gross</p><p className="text-sm font-bold">{fmtKES(p9Data.total_gross)}</p></div>
                <div className="bg-white border rounded-lg p-3"><p className="text-xs text-gray-500">PAYE</p><p className="text-sm font-bold text-red-600">{fmtKES(p9Data.total_paye)}</p></div>
                <div className="bg-white border rounded-lg p-3"><p className="text-xs text-gray-500">NSSF</p><p className="text-sm font-bold text-red-600">{fmtKES(p9Data.total_nssf)}</p></div>
                <div className="bg-white border rounded-lg p-3"><p className="text-xs text-gray-500">NHIF</p><p className="text-sm font-bold text-red-600">{fmtKES(p9Data.total_nhif)}</p></div>
                <div className="bg-white border rounded-lg p-3"><p className="text-xs text-gray-500">Net Pay</p><p className="text-sm font-bold text-green-700">{fmtKES(p9Data.total_net)}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Period</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Gross Pay</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">PAYE</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">NSSF</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">NHIF</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {p9Data.records.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-surface/50">
                        <td className="py-2.5 pr-4 text-gray-700">{fmtDate(r.pay_date)}</td>
                        <td className="py-2.5 pr-4 text-right">{fmtKES(r.gross_pay)}</td>
                        <td className="py-2.5 pr-4 text-right text-red-600">{fmtKES(r.paye)}</td>
                        <td className="py-2.5 pr-4 text-right text-red-600">{fmtKES(r.nssf_employee)}</td>
                        <td className="py-2.5 pr-4 text-right text-red-600">{fmtKES(r.nhif)}</td>
                        <td className="py-2.5 text-right font-semibold text-green-700">{fmtKES(r.net_pay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">Select filters and click "Run Report" to view data</div>
          )}
        </div>
      </div>
    </div>
  );
}
