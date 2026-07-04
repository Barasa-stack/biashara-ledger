'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Monitor, Key,
  Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, RefreshCw, Target, Activity,
  Building2, UserPlus, Smartphone,
  Loader2, Upload, Shield, X, Send, Ban
} from 'lucide-react';

interface KPICardData {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  icon: React.ReactNode;
  color: string;
}

interface Activity {
  id: number;
  text: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function KPICard({ label, value, trend, icon, color }: KPICardData) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.direction === 'up' ? 'bg-brand-light text-brand' : 'bg-red-50 text-red-700'
          }`}>
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-12 text-right">{value}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const colors: Record<string, string> = {
    success: 'bg-brand-light text-brand',
    warning: 'bg-orange-100 text-orange-700',
    info: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700',
  };
  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={14} />,
    warning: <AlertTriangle size={14} />,
    info: <Clock size={14} />,
    error: <XCircle size={14} />,
  };
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <span className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${colors[activity.type]}`}>
        {icons[activity.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700 truncate">{activity.text}</p>
        <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
      </div>
    </div>
  );
}

function QuickActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
    >
      <span className="text-brand">{icon}</span>
      {label}
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 pb-10 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      {message}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-brand animate-spin" /></div>}>
      <AdminDashboard />
    </Suspense>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [offlineSessions, setOfflineSessions] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<string | null>(null);

  // Form state
  const [genLicense, setGenLicense] = useState({ email: '', plan: 'standard', clientName: '' });
  const [addClient, setAddClient] = useState({ company_name: '', email: '', max_users: 5 });
  const [uploadUpdate, setUploadUpdate] = useState({ version: '', changes: '', isMandatory: false });
  const [transferLicense, setTransferLicense] = useState({ licenseKey: '', newClientEmail: '' });
  const [revokeLicense, setRevokeLicense] = useState({ licenseKey: '' });

  const fetchData = async () => {
    try {
      const [c, l, o, d] = await Promise.all([
        fetch('/api/admin/clients').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/licenses').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/offline-clients').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/dashboard').then(r => r.ok ? r.json() : null),
      ]);
      if (c?.error === 'Unauthorized' || l?.error === 'Unauthorized') {
        router.push('/admin/login');
        return;
      }
      setClients(Array.isArray(c) ? c : []);
      setLicenses(Array.isArray(l) ? l : []);
      setOfflineSessions(Array.isArray(o) ? o : []);
      if (d) {
        setDashboardData(d);
        setActivities(d.activity || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const action = searchParams?.get('action');
    if (action && ['generate-license', 'add-client', 'upload-update', 'transfer-license', 'revoke-license', 'offline-activation'].includes(action)) {
      setModal(action);
    }
  }, [searchParams]);

  const handleApi = async (url: string, body: any, successMsg: string, onSuccess?: () => Promise<void>) => {
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error || 'Request failed', type: 'error' });
        return;
      }
      setToast({ message: successMsg, type: 'success' });
      if (onSuccess) await onSuccess();
      setModal(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const activeClients = clients.filter((c: any) => c.is_active);
  const trialClients = clients.filter((c: any) => c.is_trial);
  const activeLicenses = licenses.filter((l: any) => l.is_active);
  const expiredLicenses = licenses.filter((l: any) => !l.is_active && l.expires_at && new Date(l.expires_at) < now);
  const revokedLicenses = licenses.filter((l: any) => !l.is_active && !l.is_used);
  const connectedDesktops = offlineSessions.filter((s: any) => s.online_status === 'online' || s.online_status === 'connected');
  const pendingActivations = offlineSessions.filter((s: any) => s.session_status === 'pending');
  const offlineComputers = offlineSessions.filter((s: any) => s.online_status === 'offline');

  const revenueToday = dashboardData?.revenue?.today || 0;
  const revenueMonth = dashboardData?.revenue?.month || 0;
  const revenueYear = dashboardData?.revenue?.year || 0;
  const monthlyGrowth = dashboardData?.revenue?.monthlyGrowth || 0;
  const latestVersion = dashboardData?.latestVersion || '—';
  const newThisWeek = dashboardData?.clients?.newThisWeek || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-brand animate-spin" />
      </div>
    );
  }

  const kpiCards: KPICardData[][] = [
    [
      { label: 'Revenue Today', value: `$${revenueToday.toLocaleString()}`, trend: { direction: 'up', value: '+8.2%' }, icon: <DollarSign size={18} className="text-white" />, color: 'bg-brand' },
      { label: 'Revenue This Month', value: `$${revenueMonth.toLocaleString()}`, trend: { direction: 'up', value: '+12.5%' }, icon: <BarChart3 size={18} className="text-white" />, color: 'bg-brand' },
      { label: 'Revenue This Year', value: `$${revenueYear.toLocaleString()}`, icon: <Target size={18} className="text-white" />, color: 'bg-brand' },
      { label: 'Monthly Growth', value: `${monthlyGrowth}%`, trend: { direction: 'up', value: '+2.1pp' }, icon: <TrendingUp size={18} className="text-white" />, color: 'bg-brand' },
    ],
    [
      { label: 'Total Clients', value: clients.length, trend: { direction: 'up', value: '+3' }, icon: <Building2 size={18} className="text-white" />, color: 'bg-blue-600' },
      { label: 'Active Clients', value: activeClients.length, icon: <CheckCircle2 size={18} className="text-white" />, color: 'bg-blue-600' },
      { label: 'Online Clients', value: connectedDesktops.length, icon: <Wifi size={18} className="text-white" />, color: 'bg-blue-600' },
      { label: 'Offline Clients', value: offlineComputers.length, icon: <WifiOff size={18} className="text-white" />, color: 'bg-orange-600' },
    ],
    [
      { label: 'Active Licenses', value: activeLicenses.length, trend: { direction: 'up', value: '+5' }, icon: <Key size={18} className="text-white" />, color: 'bg-violet-600' },
      { label: 'Expired Licenses', value: expiredLicenses.length, icon: <Clock size={18} className="text-white" />, color: 'bg-orange-600' },
      { label: 'Revoked Licenses', value: revokedLicenses.length, icon: <XCircle size={18} className="text-white" />, color: 'bg-red-600' },
      { label: 'Expiring Soon (7d)', value: licenses.filter((l: any) => l.is_active && l.expires_at && new Date(l.expires_at) > now && new Date(l.expires_at) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length, icon: <AlertTriangle size={18} className="text-white" />, color: 'bg-orange-600' },
    ],
    [
      { label: 'Connected PCs', value: connectedDesktops.length, icon: <Monitor size={18} className="text-white" />, color: 'bg-cyan-600' },
      { label: 'Inactive PCs', value: offlineComputers.length, icon: <Smartphone size={18} className="text-white" />, color: 'bg-gray-500' },
      { label: 'Pending Activations', value: pendingActivations.length, icon: <Clock size={18} className="text-white" />, color: 'bg-orange-600' },
      { label: 'System Health', value: 'Healthy', icon: <Activity size={18} className="text-white" />, color: 'bg-brand' },
    ],
  ];

  const planData = [
    { label: 'Basic', value: clients.filter((c: any) => c.plan === 'basic' || (!c.plan && !c.is_trial)).length, total: clients.length || 1, color: 'bg-blue-500' },
    { label: 'Standard', value: clients.filter((c: any) => c.plan === 'standard').length, total: clients.length || 1, color: 'bg-brand' },
    { label: 'Premium', value: clients.filter((c: any) => c.plan === 'premium').length, total: clients.length || 1, color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* KPI Cards */}
      {kpiCards.map((row, ri) => (
        <div key={ri} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {row.map((kpi, ki) => (
            <KPICard key={ki} {...kpi} />
          ))}
        </div>
      ))}

      {/* Revenue + Subscriptions + Licenses row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
            <button className="text-xs text-brand hover:text-brand font-medium">View Report →</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Today', value: revenueToday, color: 'bg-brand' },
              { label: 'This Month', value: revenueMonth, color: 'bg-blue-500' },
              { label: 'This Year', value: revenueYear, color: 'bg-violet-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm font-semibold text-gray-900">${item.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg Revenue per Client</span>
              <span className="font-semibold text-gray-900">${clients.length > 0 ? Math.round(revenueYear / clients.length).toLocaleString() : 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">Subscription Plans</h3>
            <span className="text-xs text-gray-400">{clients.length} total</span>
          </div>
          <div className="space-y-1">
            {planData.map((p) => (
              <StatRow key={p.label} {...p} />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            {[
              { label: 'Trial Users', value: trialClients.length },
              { label: 'New This Week', value: newThisWeek },
              { label: 'Renewals', value: dashboardData?.revenue?.billingMonth ? Math.round(dashboardData.revenue.billingMonth / 100) : 0 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">License Overview</h3>
            <button className="text-xs text-brand hover:text-brand font-medium">Manage →</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Total', value: licenses.length, color: 'text-gray-900' },
              { label: 'Active', value: activeLicenses.length, color: 'text-brand' },
              { label: 'Expired', value: expiredLicenses.length, color: 'text-orange-600' },
              { label: 'Revoked', value: revokedLicenses.length, color: 'text-red-600' },
            ].map((l) => (
              <div key={l.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{l.label}</span>
                <span className={`text-sm font-semibold ${l.color}`}>{l.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Latest version</span>
              <span className="font-semibold text-gray-900">{latestVersion ? `v${latestVersion}` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline + Activity + Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">Offline Monitoring</h3>
            <button className="text-xs text-brand hover:text-brand font-medium">View All →</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Desktop Installations', value: offlineSessions.length, icon: Monitor, color: 'text-gray-900' },
              { label: 'Connected PCs', value: connectedDesktops.length, icon: Wifi, color: 'text-brand' },
              { label: 'Offline PCs', value: offlineComputers.length, icon: WifiOff, color: 'text-orange-600' },
              { label: 'Pending Activations', value: pendingActivations.length, icon: RefreshCw, color: 'text-blue-600' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={item.color} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-xs text-brand hover:text-brand font-medium">View All</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No recent activity</div>
            ) : (
              activities.map((a: any, i: number) => (
                <ActivityItem key={i} activity={{
                  id: i,
                  text: `${a.action}: ${a.entity || a.client_name || ''}`,
                  time: a.created_at ? formatTimeAgo(a.created_at) : '',
                  type: a.type === 'license_revoked' ? 'error' : a.type === 'license_expiring' ? 'warning' : 'info',
                }} />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionBtn icon={<Key size={16} />} label="Generate License" onClick={() => setModal('generate-license')} />
            <QuickActionBtn icon={<UserPlus size={16} />} label="Add Client" onClick={() => setModal('add-client')} />
            <QuickActionBtn icon={<Upload size={16} />} label="Upload Update" onClick={() => setModal('upload-update')} />
            <QuickActionBtn icon={<RefreshCw size={16} />} label="Transfer License" onClick={() => setModal('transfer-license')} />
            <QuickActionBtn icon={<Shield size={16} />} label="Revoke License" onClick={() => setModal('revoke-license')} />
            <QuickActionBtn icon={<Monitor size={16} />} label="Offline Activation" onClick={() => router.push('/admin/offline')} />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pending updates</span>
              <span className="font-semibold text-orange-600">{dashboardData?.licenses?.expiringSoon || 0} expiring</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── GENERATE LICENSE MODAL ───── */}
      {modal === 'generate-license' && (
        <Modal title="Generate License" onClose={() => { if (!saving) setModal(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Client Email *</label>
              <input type="email" value={genLicense.email} onChange={e => setGenLicense({ ...genLicense, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan</label>
              <select value={genLicense.plan} onChange={e => setGenLicense({ ...genLicense, plan: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <button onClick={() => {
              if (!genLicense.email.trim()) { setToast({ message: 'Client email is required', type: 'error' }); return; }
              handleApi('/api/admin/licenses/generate', genLicense, 'License generated successfully', fetchData);
            }} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 rounded-lg transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              {saving ? 'Generating...' : 'Generate License'}
            </button>
          </div>
        </Modal>
      )}

      {/* ───── ADD CLIENT MODAL ───── */}
      {modal === 'add-client' && (
        <Modal title="Add Client" onClose={() => { if (!saving) setModal(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Name *</label>
              <input type="text" value={addClient.company_name} onChange={e => setAddClient({ ...addClient, company_name: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
              <input type="email" value={addClient.email} onChange={e => setAddClient({ ...addClient, email: e.target.value })}
                placeholder="admin@acme.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Users</label>
              <input type="number" min={1} value={addClient.max_users} onChange={e => setAddClient({ ...addClient, max_users: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <button onClick={() => {
              if (!addClient.company_name.trim() || !addClient.email.trim()) { setToast({ message: 'Company name and email are required', type: 'error' }); return; }
              handleApi('/api/admin/clients', addClient, 'Client registered successfully', fetchData);
            }} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 rounded-lg transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
              {saving ? 'Creating...' : 'Add Client'}
            </button>
          </div>
        </Modal>
      )}

      {/* ───── UPLOAD UPDATE MODAL ───── */}
      {modal === 'upload-update' && (
        <Modal title="Upload Update" onClose={() => { if (!saving) setModal(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Version *</label>
              <input type="text" value={uploadUpdate.version} onChange={e => setUploadUpdate({ ...uploadUpdate, version: e.target.value })}
                placeholder="e.g. 2.5.0"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Release Notes</label>
              <textarea value={uploadUpdate.changes} onChange={e => setUploadUpdate({ ...uploadUpdate, changes: e.target.value })}
                placeholder="What's new..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={uploadUpdate.isMandatory} onChange={e => setUploadUpdate({ ...uploadUpdate, isMandatory: e.target.checked })}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand" />
              <span className="text-sm text-gray-600">Mandatory update</span>
            </label>
            <button onClick={() => {
              if (!uploadUpdate.version.trim()) { setToast({ message: 'Version is required', type: 'error' }); return; }
              handleApi('/api/admin/update', uploadUpdate, 'Update published successfully', fetchData);
            }} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 rounded-lg transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {saving ? 'Publishing...' : 'Publish Update'}
            </button>
          </div>
        </Modal>
      )}

      {/* ───── TRANSFER LICENSE MODAL ───── */}
      {modal === 'transfer-license' && (
        <Modal title="Transfer License" onClose={() => { if (!saving) setModal(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">License Key *</label>
              <input type="text" value={transferLicense.licenseKey} onChange={e => setTransferLicense({ ...transferLicense, licenseKey: e.target.value })}
                placeholder="BL-2026-XXXXXXXX"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New Client Email *</label>
              <input type="email" value={transferLicense.newClientEmail} onChange={e => setTransferLicense({ ...transferLicense, newClientEmail: e.target.value })}
                placeholder="newclient@example.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <button onClick={() => {
              if (!transferLicense.licenseKey.trim() || !transferLicense.newClientEmail.trim()) { setToast({ message: 'License key and new client email are required', type: 'error' }); return; }
              handleApi('/api/admin/transfer-license', transferLicense, 'License transferred successfully', fetchData);
            }} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 rounded-lg transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {saving ? 'Transferring...' : 'Transfer License'}
            </button>
          </div>
        </Modal>
      )}

      {/* ───── REVOKE LICENSE MODAL ───── */}
      {modal === 'revoke-license' && (
        <Modal title="Revoke License" onClose={() => { if (!saving) setModal(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">License Key *</label>
              <input type="text" value={revokeLicense.licenseKey} onChange={e => setRevokeLicense({ ...revokeLicense, licenseKey: e.target.value })}
                placeholder="BL-2026-XXXXXXXX"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-mono" />
            </div>
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              This will immediately deactivate the license and prevent all associated clients from logging in.
            </p>
            <button onClick={() => {
              if (!revokeLicense.licenseKey.trim()) { setToast({ message: 'License key is required', type: 'error' }); return; }
              handleApi('/api/admin/revoke-license', revokeLicense, 'License revoked successfully', fetchData);
            }} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-lg transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              {saving ? 'Revoking...' : 'Revoke License'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
