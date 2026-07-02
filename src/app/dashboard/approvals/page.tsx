'use client';

import { useEffect, useState } from 'react';
import { Plus, X, CheckSquare, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, exportWord } from '@/lib/export-utils'
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';;

type Workflow = {
  id: string;
  workflow_name: string;
  entity_type: string;
  trigger_amount: number;
  approver_role: string;
  is_active: boolean;
  created_at: string;
};

type Request = {
  id: string;
  entity_type: string;
  entity_id: string;
  amount: number;
  requestor: string;
  status: string;
  notes: string;
  created_at: string;
};

type Tab = 'workflows' | 'requests';

const emptyWorkflowForm = {
  workflow_name: '',
  entity_type: 'expense',
  trigger_amount: 0,
  approver_role: 'admin',
  is_active: true,
};

const emptyRequestNotes = '';

const ENTITY_TYPES = ['purchase_invoice', 'expense', 'sales_invoice'];
const APPROVER_ROLES = ['admin', 'accountant', 'hr_manager'];
const STATUSES = ['pending', 'approved', 'rejected'];

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyWorkflowForm);
  const [requestNotes, setRequestNotes] = useState('');
  const [actionRequest, setActionRequest] = useState<Request | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkflows = () => {
    setLoading(true);
    setError('');
    fetch('/api/approval-workflows')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load workflows'))
      .then(setWorkflows)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const fetchRequests = () => {
    setLoading(true);
    setError('');
    fetch('/api/approval-requests')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load requests'))
      .then(setRequests)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'workflows') fetchWorkflows();
    else fetchRequests();
  }, [tab]);

  const openAdd = () => {
    setForm(emptyWorkflowForm);
    setShowModal(true);
  };

  const set = (field: string) => (v: string | number | boolean) =>
    setForm(prev => ({ ...prev, [field]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/approval-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save workflow');
      setShowModal(false);
      fetchWorkflows();
    } catch (e: any) {
      toast(e.message || 'Error saving workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalAction = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/approval-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes: requestNotes }),
      });
      if (!res.ok) throw new Error('Failed to update request');
      setActionRequest(null);
      setRequestNotes('');
      fetchRequests();
    } catch (e: any) {
      toast(e.message || 'Error updating request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (entityFilter && r.entity_type !== entityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.entity_id.toLowerCase().includes(q) || r.requestor.toLowerCase().includes(q);
    }
    return true;
  });

  const exportColumns = tab === 'workflows'
    ? [
        { key: 'workflow_name', label: 'Name' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'trigger_amount', label: 'Trigger Amount' },
        { key: 'approver_role', label: 'Approver Role' },
        { key: 'is_active', label: 'Active' },
      ]
    : [
        { key: 'entity_type', label: 'Type' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'requestor', label: 'Requestor' },
        { key: 'status', label: 'Status' },
      ];

  const exportFileName = `approvals-${tab}-${new Date().toISOString().split('T')[0]}`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load data</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={tab === 'workflows' ? fetchWorkflows : fetchRequests} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
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
            <CheckSquare className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Approvals</h1>
            <p className="text-xs text-gray-500">Manage approval workflows and requests</p>
          </div>
        </div>
        {tab === 'workflows' && (
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
            <Plus className="h-4 w-4" />
            Add Workflow
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border w-fit">
        <button
          onClick={() => setTab('workflows')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${tab === 'workflows' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Workflows
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${tab === 'requests' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Requests
        </button>
      </div>

      {tab === 'workflows' && (
        <>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search workflows..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
              </div>
              <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
                <option value="">All Types</option>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
              <div className="relative group">
                <button className="inline-flex items-center gap-1.5 border border-border text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"><Search className="h-4 w-4" /> Export</button>
                <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button onClick={() => exportCSV(workflows, exportColumns, `${exportFileName}.csv`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                  <button onClick={() => exportExcel(workflows, exportColumns, `${exportFileName}.xlsx`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel (.xlsx)</button>
                  <button onClick={() => exportPDF('Workflows', workflows, exportColumns, `${exportFileName}.pdf`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                  <button onClick={() => exportWord('Workflows', workflows, exportColumns, `${exportFileName}.doc`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Word (.doc)</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border p-5">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  <span className="text-sm text-gray-600">Loading workflows...</span>
                </div>
              </div>
            ) : workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <CheckSquare className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-3">No workflows configured</p>
                <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Your First Workflow
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Name</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Entity Type</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Trigger Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Approver Role</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {workflows.map(w => (
                      <tr key={w.id} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-800">{w.workflow_name}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                            {w.entity_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-gray-800">${Number(w.trigger_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 pr-4 text-gray-700 capitalize">{w.approver_role.replace(/_/g, ' ')}</td>
                        <td className="py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {w.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'requests' && (
        <>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search requests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
              </div>
              <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
                <option value="">All Types</option>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              {(entityFilter || statusFilter || searchQuery) && (
                <button onClick={() => { setEntityFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border p-5">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  <span className="text-sm text-gray-600">Loading requests...</span>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <CheckSquare className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No approval requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Type</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Entity ID</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Requestor</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3 pr-4">
                          <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                            {r.entity_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-800">{r.entity_id}</td>
                        <td className="py-3 pr-4 text-right font-medium text-gray-800">${Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 pr-4 text-gray-700">{r.requestor}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                            r.status === 'approved' ? 'bg-green-100 text-green-700' :
                            r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {r.status === 'pending' && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setActionRequest(r)}
                                className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setActionRequest(r);
                                  setRequestNotes(emptyRequestNotes);
                                }}
                                className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">Add Workflow</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Workflow Name</label>
                <input
                  type="text"
                  value={form.workflow_name}
                  onChange={e => set('workflow_name')(e.target.value)}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Entity Type</label>
                  <select
                    value={form.entity_type}
                    onChange={e => set('entity_type')(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Trigger Amount</label>
                  <input
                    type="number"
                    value={form.trigger_amount}
                    onChange={e => set('trigger_amount')(Number(e.target.value) || 0)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Approver Role</label>
                <select
                  value={form.approver_role}
                  onChange={e => set('approver_role')(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  {APPROVER_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => set('is_active')(e.target.checked)}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.workflow_name.trim()}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add Workflow'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg border border-border w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">
                {actionRequest.status === 'rejected' ? 'Reject' : 'Approve'} Request
              </h2>
              <button onClick={() => { setActionRequest(null); setRequestNotes(''); }} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  {actionRequest.status === 'rejected' ? 'Reject' : 'Approve'} request for <strong>{actionRequest.entity_id}</strong> ({actionRequest.entity_type.replace(/_/g, ' ')}) — ${Number(actionRequest.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <textarea
                  value={requestNotes}
                  onChange={e => setRequestNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Add notes..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setActionRequest(null); setRequestNotes(''); }} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleApprovalAction(actionRequest.id, 'approved')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleApprovalAction(actionRequest.id, 'rejected')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reject
                  </>
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
