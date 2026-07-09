'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Clock, Filter } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type Attendance = {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours: number;
  overtime_hours: number;
  status: string;
  notes: string;
  created_at: string;
};

type Employee = {
  id: string;
  name: string;
  employee_code: string;
};

const STATUS_OPTIONS = ['present', 'absent', 'late', 'half-day', 'leave'];

const emptyForm = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0],
  clock_in: '08:00',
  clock_out: '17:00',
  status: 'present',
  notes: '',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US') : '—';
const fmtKES = (n: number | string | null | undefined) => `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchRecords = () => {
    setLoading(true);
    setError('');
    fetch('/api/payroll/attendance')
      .then(async r => {
        if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || `Failed (${r.status})`); }
        return r.json();
      })
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchEmployees = () =>
    fetch('/api/payroll').then(r => r.ok ? r.json() : []).then(setEmployees).catch(() => {});

  useEffect(() => { fetchRecords(); fetchEmployees(); }, []);

  const filtered = useMemo(() => {
    let list = records;
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (dateFrom) list = list.filter(r => (r.date || '') >= dateFrom);
    if (dateTo) list = list.filter(r => (r.date || '') <= dateTo);
    return list;
  }, [records, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present');
    const totalHours = present.reduce((s, r) => s + (r.hours || 0), 0);
    const totalOvertime = records.reduce((s, r) => s + (r.overtime_hours || 0), 0);
    return { total: records.length, present: present.length, absent: records.filter(r => r.status === 'absent').length, totalHours, totalOvertime };
  }, [records]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (r: Attendance) => {
    setEditing(r);
    setForm({
      employee_id: r.employee_id,
      date: r.date?.split('T')[0] || '',
      clock_in: r.clock_in || '',
      clock_out: r.clock_out || '',
      status: r.status,
      notes: r.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/payroll/attendance';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowModal(false);
      fetchRecords();
    } catch (e: any) { toast(e.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (r: Attendance) => {
    if (!await confirm(`Delete attendance record for "${r.employee_name}"?`)) return;
    try {
      const res = await fetch('/api/payroll/attendance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) });
      if (!res.ok) throw new Error('Failed to delete');
      fetchRecords();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const set = (field: string) => (v: string | number) => setForm(prev => ({ ...prev, [field]: v }));

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', late: 'bg-yellow-100 text-yellow-700', 'half-day': 'bg-orange-100 text-orange-700', leave: 'bg-blue-100 text-blue-700' };
    return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${colors[s] || 'bg-gray-100 text-gray-600'}`}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</span>;
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-brand font-medium mb-2">Failed to load attendance</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={fetchRecords} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Attendance & Timesheets</h1>
            <p className="text-xs text-gray-500">Track working hours, overtime, and absences</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-border p-3"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold text-gray-800">{stats.total}</p></div>
        <div className="bg-white rounded-lg border border-border p-3"><p className="text-xs text-gray-500">Present</p><p className="text-lg font-bold text-green-700">{stats.present}</p></div>
        <div className="bg-white rounded-lg border border-border p-3"><p className="text-xs text-gray-500">Absent</p><p className="text-lg font-bold text-red-700">{stats.absent}</p></div>
        <div className="bg-white rounded-lg border border-border p-3"><p className="text-xs text-gray-500">Total Hours</p><p className="text-lg font-bold text-gray-800">{stats.totalHours.toFixed(1)}</p></div>
        <div className="bg-white rounded-lg border border-border p-3"><p className="text-xs text-gray-500">Overtime</p><p className="text-lg font-bold text-yellow-700">{stats.totalOvertime.toFixed(1)}h</p></div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm" />
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /><span className="text-sm text-gray-600">Loading...</span></div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Clock className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No attendance records found</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors"><Plus className="h-4 w-4" />Add Record</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Clock In</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Clock Out</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Hours</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Overtime</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{r.employee_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(r.date)}</td>
                    <td className="py-3 pr-4 text-gray-700">{r.clock_in || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{r.clock_out || '—'}</td>
                    <td className="py-3 pr-4 text-right font-medium">{r.hours ? r.hours.toFixed(1) : '—'}</td>
                    <td className="py-3 pr-4 text-right text-yellow-700 font-medium">{r.overtime_hours ? r.overtime_hours.toFixed(1) : '—'}</td>
                    <td className="py-3 pr-4">{statusBadge(r.status)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(r)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
              <h2 className="text-base font-semibold text-gray-800">{editing ? 'Edit Attendance' : 'Add Attendance Record'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Employee</label>
                <select value={form.employee_id} onChange={e => set('employee_id')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}{emp.employee_code ? ` (${emp.employee_code})` : ''}</option>)}
                </select>
              </div>
              <Field label="Date" value={form.date} onChange={set('date')} type="date" required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Clock In" value={form.clock_in} onChange={set('clock_in')} type="time" />
                <Field label="Clock Out" value={form.clock_out} onChange={set('clock_out')} type="time" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select value={form.status} onChange={e => set('status')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
                </select>
              </div>
              <Field label="Notes" value={form.notes} onChange={set('notes')} />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.employee_id || !form.date}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : editing ? 'Update' : 'Add Record'}
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
