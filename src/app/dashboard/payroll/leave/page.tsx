'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, CalendarCheck, Check, XCircle, Clock } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

type LeaveRequest = {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  approved_by: string;
  approved_at: string;
  notes: string;
  created_at: string;
};

type Employee = {
  id: string;
  name: string;
  employee_code: string;
};

const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'study', 'compassionate', 'unpaid'];

const emptyForm = {
  employee_id: '',
  leave_type: 'annual',
  reason: '',
  start_date: '',
  end_date: '',
  days: 1,
  status: 'pending',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US') : '—';

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const fetchRequests = () => {
    setLoading(true);
    setError('');
    fetch('/api/payroll/leave')
      .then(async r => {
        if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || `Failed (${r.status})`); }
        return r.json();
      })
      .then(setRequests)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchEmployees = () =>
    fetch('/api/payroll').then(r => r.ok ? r.json() : []).then(setEmployees).catch(() => {});

  useEffect(() => { fetchRequests(); fetchEmployees(); }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (r: LeaveRequest) => {
    setEditing(r);
    setForm({
      employee_id: r.employee_id,
      leave_type: r.leave_type,
      reason: r.reason,
      start_date: r.start_date?.split('T')[0] || '',
      end_date: r.end_date?.split('T')[0] || '',
      days: r.days,
      status: r.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/payroll/leave';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'Failed to save'); }
      setShowModal(false);
      fetchRequests();
    } catch (e: any) { toast(e.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (r: LeaveRequest) => {
    if (!await confirm(`Delete leave request for "${r.employee_name}"?`)) return;
    try {
      const res = await fetch('/api/payroll/leave', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) });
      if (!res.ok) throw new Error('Failed to delete');
      fetchRequests();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const approveReject = async (r: LeaveRequest, newStatus: string) => {
    try {
      const res = await fetch('/api/payroll/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, status: newStatus, approved_by: 'Admin', approved_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed');
      fetchRequests();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const set = (field: string) => (v: string | number) => setForm(prev => ({ ...prev, [field]: v }));

  const updateDays = () => {
    if (form.start_date && form.end_date) {
      const diff = Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 3600 * 24)) + 1);
      set('days')(diff);
    }
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600' };
    return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${colors[s] || colors.pending}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-brand font-medium mb-2">Failed to load leave requests</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={fetchRequests} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Leave Management</h1>
            <p className="text-xs text-gray-500">Manage employee leave requests and balances</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          New Leave Request
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-3">
        <Clock className="h-4 w-4 text-gray-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /><span className="text-sm text-gray-600">Loading...</span></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <CalendarCheck className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No leave requests found</p>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors"><Plus className="h-4 w-4" />New Leave Request</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Reason</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Start</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">End</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Days</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{r.employee_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700 capitalize">{r.leave_type}</td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate">{r.reason || '—'}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(r.start_date)}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(r.end_date)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{r.days}</td>
                    <td className="py-3 pr-4">{statusBadge(r.status)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => approveReject(r, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve"><Check className="h-4 w-4" /></button>
                            <button onClick={() => approveReject(r, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject"><XCircle className="h-4 w-4" /></button>
                          </>
                        )}
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
              <h2 className="text-base font-semibold text-gray-800">{editing ? 'Edit Leave Request' : 'New Leave Request'}</h2>
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
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select value={form.leave_type} onChange={e => set('leave_type')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <Field label="Reason" value={form.reason} onChange={set('reason')} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" value={form.start_date} onChange={v => { set('start_date')(v); setTimeout(updateDays, 0); }} type="date" />
                <Field label="End Date" value={form.end_date} onChange={v => { set('end_date')(v); setTimeout(updateDays, 0); }} type="date" />
              </div>
              <Field label="Days" value={String(form.days)} onChange={v => set('days')(Number(v) || 1)} type="number" />
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => set('status')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.employee_id || !form.start_date}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : editing ? 'Update' : 'Submit Request'}
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
