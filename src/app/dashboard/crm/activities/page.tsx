'use client';

import { useEffect, useState } from 'react';
import { Activity, Phone, Mail, Calendar, FileText, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note'] as const;

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'note', lead_id: '', subject: '', description: '' });
  const [leads, setLeads] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/crm/activities').then(r => r.ok ? r.json() : []),
      fetch('/api/crm/leads').then(r => r.ok ? r.json() : []),
    ]).then(([a, l]) => { setActivities(a); setLeads(l); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Activity logged');
      setShowAdd(false);
      setForm({ type: 'note', lead_id: '', subject: '', description: '' });
      loadData();
    } catch (e: any) { toast(e.message || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Delete this activity?')) return;
    try {
      await fetch('/api/crm/activities', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      loadData();
    } catch (e: any) { toast(e.message || 'Error'); }
  };

  const icons: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, note: FileText };
  const iconColors: Record<string, string> = {
    call: 'bg-green-100 text-green-600', email: 'bg-blue-100 text-blue-600',
    meeting: 'bg-purple-100 text-purple-600', note: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><Activity className="h-5 w-5 text-brand" /></div>
          <div><h1 className="text-lg font-semibold text-gray-800">Activities</h1><p className="text-xs text-gray-500">Log calls, emails, meetings, and notes</p></div>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
          <Activity className="h-4 w-4" /> Log Activity
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Activity className="h-8 w-8 mb-2" /><p className="text-sm">No activities logged yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((a: any) => {
              const Icon = icons[a.type] || FileText;
              const colorClass = iconColors[a.type] || 'bg-gray-100 text-gray-600';
              return (
                <div key={a.id} className="flex items-start gap-4 border-b border-border pb-4 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 capitalize">{a.type}</span>
                      {a.lead_name && <span className="text-xs text-gray-400">with {a.lead_name}</span>}
                      <span className="text-xs text-gray-400 ml-auto">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {a.subject && <p className="text-sm text-gray-700 mt-1">{a.subject}</p>}
                    {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-full max-w-lg mx-4 shadow-xl">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-gray-800">Log Activity</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Activity Type</label>
                <div className="flex gap-2">
                  {ACTIVITY_TYPES.map(t => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      className={`px-4 py-2 text-sm rounded-lg border capitalize transition-colors ${form.type === t ? 'bg-brand text-white border-brand' : 'border-border text-gray-600 hover:bg-gray-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Lead</label>
                <select value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  <option value="">No lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.email ? ` (${l.email})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAdd(false)} className="text-xs font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-surface">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Log Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
