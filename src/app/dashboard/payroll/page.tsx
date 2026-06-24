'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/lib/use-debounce';
import { Plus, Pencil, Trash2, X, Users, Search, Download } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils';

type Employee = {
  id: number;
  employee_code: string;
  name: string;
  date_of_birth: string;
  national_id: string;
  tax_pin: string;
  phone: string;
  email: string;
  address: string;
  department: string;
  job_title: string;
  date_of_hire: string;
  employment_type: string;
  bank_name: string;
  account_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  salary: number;
  status: string;
  created_at: string;
};

const emptyForm = {
  employee_code: '',
  name: '',
  date_of_birth: '',
  national_id: '',
  tax_pin: '',
  phone: '',
  email: '',
  address: '',
  department: '',
  job_title: '',
  date_of_hire: new Date().toISOString().split('T')[0],
  employment_type: 'full-time',
  bank_name: '',
  account_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
  salary: 0,
};

const fmtKES = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract'];

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchEmployees = () => {
    setLoading(true);
    setError('');
    fetch('/api/payroll')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load employees'))
      .then(setEmployees)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filteredEmployees = useMemo(() => {
    let list = [...employees];
    if (departmentFilter) list = list.filter(e => e.department === departmentFilter);
    if (dateFrom) list = list.filter(e => (e.date_of_hire || '') >= dateFrom);
    if (dateTo) list = list.filter(e => (e.date_of_hire || '') <= dateTo);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.employee_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, departmentFilter, dateFrom, dateTo, debouncedSearch]);

  const departments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      employee_code: e.employee_code,
      name: e.name,
      date_of_birth: e.date_of_birth?.split('T')[0] || '',
      national_id: e.national_id,
      tax_pin: e.tax_pin,
      phone: e.phone,
      email: e.email,
      address: e.address,
      department: e.department,
      job_title: e.job_title,
      date_of_hire: e.date_of_hire?.split('T')[0] || '',
      employment_type: e.employment_type,
      bank_name: e.bank_name,
      account_number: e.account_number,
      emergency_contact_name: e.emergency_contact_name,
      emergency_contact_phone: e.emergency_contact_phone,
      notes: e.notes,
      salary: e.salary,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/payroll';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id, type: 'employee' } : { ...form, type: 'employee' };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save employee');
      setShowModal(false);
      fetchEmployees();
    } catch (e: any) {
      alert(e.message || 'Error saving employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete employee "${emp.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/payroll', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, type: 'employee' }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchEmployees();
    } catch (e: any) {
      alert(e.message || 'Error deleting employee');
    }
  };

  const set = (field: string) => (v: string | number) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const exportColumns = [
    { key: 'employee_code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'employment_type', label: 'Employment Type' },
    { key: 'salary', label: 'Salary (KES)' },
    { key: 'status', label: 'Status' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ];

  const exportFileName = `employees-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load employees</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchEmployees} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Employees</h1>
            <p className="text-xs text-gray-500">Manage your workforce</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Download className="h-4 w-4" /> Export</button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportCSV(filteredEmployees, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
              <button onClick={() => exportExcel(filteredEmployees, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
              <button onClick={() => exportPDF('Employees', filteredEmployees, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
              <button onClick={() => exportWord('Employees', filteredEmployees, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
            </div>
          </div>
          {(dateFrom || dateTo || departmentFilter || searchQuery) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setDepartmentFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading employees...</span>
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No employees yet</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
              <Plus className="h-4 w-4" />
              Add Your First Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 w-8">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Department</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Job Title</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Email</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((emp, i) => (
                  <tr key={emp.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 w-8">{filteredEmployees.length - i}</td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-gray-800">{emp.name}</span>
                      {emp.employee_code && <p className="text-xs text-gray-400 mt-0.5">{emp.employee_code}</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{emp.department || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{emp.job_title || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-700' :
                        emp.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{emp.phone || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{emp.email || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(emp)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete">
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
          <div className="bg-white rounded-lg border border-border w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee Code" value={form.employee_code} onChange={set('employee_code')} required />
                <Field label="Full Name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth" value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
                <Field label="National ID" value={form.national_id} onChange={set('national_id')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="KRA Tax PIN" value={form.tax_pin} onChange={set('tax_pin')} />
                <Field label="Phone Number" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" value={form.email} onChange={set('email')} type="email" />
                <Field label="Department" value={form.department} onChange={set('department')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Job Title" value={form.job_title} onChange={set('job_title')} />
                <Field label="Date of Hire" value={form.date_of_hire} onChange={set('date_of_hire')} type="date" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Employment Type</label>
                  <select
                    value={form.employment_type}
                    onChange={e => set('employment_type')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>)}
                  </select>
                </div>
                <Field label="Salary (KES)" value={String(form.salary)} onChange={v => set('salary')(Number(v) || 0)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name" value={form.bank_name} onChange={set('bank_name')} />
                <Field label="Account Number" value={form.account_number} onChange={set('account_number')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Emergency Contact Name" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
                <Field label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
              </div>
              <Field label="Address" value={form.address} onChange={set('address')} />
              <Field label="Notes" value={form.notes} onChange={set('notes')} />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Employee' : 'Add Employee'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
