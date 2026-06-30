'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Monitor, Key,
  Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, RefreshCw, Target, Activity,
  Building2, UserPlus, Smartphone,
  Loader2, Upload, Shield
} from 'lucide-react';

// ─── Shared types ───────────────────────────────────────────
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

// ─── KPI Card component ─────────────────────────────────────
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

// ─── Stat row (for subscription/license breakdown) ──────────
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

// ─── Activity item ──────────────────────────────────────────
function ActivityItem({ activity }: { activity: Activity }) {
  const colors = {
    success: 'bg-brand-light text-brand',
    warning: 'bg-orange-100 text-orange-700',
    info: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700',
  };
  const icons = {
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

// ─── Quick action button ────────────────────────────────────
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

// ─── Dashboard Page ─────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [offlineSessions, setOfflineSessions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/licenses').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/offline-clients').then(r => r.ok ? r.json() : []),
    ])
      .then(([c, l, o]) => {
        if (c?.error === 'Unauthorized' || l?.error === 'Unauthorized') {
          router.push('/admin/login');
          return;
        }
        setClients(Array.isArray(c) ? c : []);
        setLicenses(Array.isArray(l) ? l : []);
        setOfflineSessions(Array.isArray(o) ? o : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const activeClients = clients.filter((c: any) => c.is_active);
  const trialClients = clients.filter((c: any) => c.is_trial);
  const activeLicenses = licenses.filter((l: any) => l.is_active);
  const expiredLicenses = licenses.filter((l: any) => !l.is_active && l.expires_at && new Date(l.expires_at) < now);
  const revokedLicenses = licenses.filter((l: any) => !l.is_active && !l.is_used);

  const connectedDesktops = offlineSessions.filter((s: any) => s.online_status === 'online' || s.online_status === 'connected');
  const pendingActivations = offlineSessions.filter((s: any) => s.session_status === 'pending');
  const offlineComputers = offlineSessions.filter((s: any) => s.online_status === 'offline');

  const revenueToday = 12500;
  const revenueMonth = 284500;
  const revenueYear = 2450000;
  const monthlyGrowth = 12.5;

  const MOCK_ACTIVITIES: Activity[] = [
    { id: 1, text: 'New client registered: Safari Inc.', time: '2 minutes ago', type: 'success' },
    { id: 2, text: 'License BL-2026-X9K2 generated for John Doe', time: '15 minutes ago', type: 'info' },
    { id: 3, text: 'Payment received: KES 5,000 from Acme Corp', time: '1 hour ago', type: 'success' },
    { id: 4, text: 'License BL-2026-A1B2 expiring in 3 days', time: '2 hours ago', type: 'warning' },
    { id: 5, text: 'Desktop activated: Windows 11 (MACHINE-001)', time: '3 hours ago', type: 'info' },
    { id: 6, text: 'License revoked: BL-2026-ZZ99 (policy violation)', time: '5 hours ago', type: 'error' },
    { id: 7, text: 'Subscription upgraded: Basic → Standard (Jane Co.)', time: '1 day ago', type: 'success' },
    { id: 8, text: 'Software update v2.4.0 published', time: '1 day ago', type: 'info' },
    { id: 9, text: 'Offline sync completed for TechVentures (12 records)', time: '2 days ago', type: 'info' },
    { id: 10, text: 'License transferred: BL-2026-BB77 to new machine', time: '2 days ago', type: 'warning' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-brand animate-spin" />
      </div>
    );
  }

  // ─── KPI cards data ─────────────────────────────────────
  const kpiCards: KPICardData[][] = [
    [
      { label: 'Revenue Today', value: `KES ${revenueToday.toLocaleString()}`, trend: { direction: 'up', value: '+8.2%' }, icon: <DollarSign size={18} className="text-white" />, color: 'bg-brand' },
      { label: 'Revenue This Month', value: `KES ${revenueMonth.toLocaleString()}`, trend: { direction: 'up', value: '+12.5%' }, icon: <BarChart3 size={18} className="text-white" />, color: 'bg-brand' },
      { label: 'Revenue This Year', value: `KES ${revenueYear.toLocaleString()}`, icon: <Target size={18} className="text-white" />, color: 'bg-brand' },
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
      { label: 'Expiring Soon (7d)', value: 3, icon: <AlertTriangle size={18} className="text-white" />, color: 'bg-orange-600' },
    ],
    [
      { label: 'Connected PCs', value: connectedDesktops.length, icon: <Monitor size={18} className="text-white" />, color: 'bg-cyan-600' },
      { label: 'Inactive PCs', value: offlineComputers.length, icon: <Smartphone size={18} className="text-white" />, color: 'bg-gray-500' },
      { label: 'Pending Activations', value: pendingActivations.length, icon: <Clock size={18} className="text-white" />, color: 'bg-orange-600' },
      { label: 'System Health', value: 'Healthy', icon: <Activity size={18} className="text-white" />, color: 'bg-brand' },
    ],
  ];

  const planData = [
    { label: 'Basic', value: 12, total: clients.length || 1, color: 'bg-blue-500' },
    { label: 'Standard', value: 8, total: clients.length || 1, color: 'bg-brand' },
    { label: 'Premium', value: 4, total: clients.length || 1, color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-8">
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
        {/* Revenue Overview */}
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
                  <span className="text-sm font-semibold text-gray-900">KES {item.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg Revenue per Client</span>
              <span className="font-semibold text-gray-900">KES {clients.length > 0 ? Math.round(revenueYear / clients.length).toLocaleString() : 0}</span>
            </div>
          </div>
        </div>

        {/* Subscription Distribution */}
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
              { label: 'New This Week', value: 2 },
              { label: 'Renewals', value: 5 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* License Overview */}
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
              <span className="font-semibold text-gray-900">v2.4.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline + Activity + Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offline Monitoring */}
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
              { label: 'Pending Sync', value: 2, icon: RefreshCw, color: 'text-blue-600' },
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-xs text-brand hover:text-brand font-medium">View All</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {MOCK_ACTIVITIES.map((a) => (
              <ActivityItem key={a.id} activity={a} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionBtn icon={<Key size={16} />} label="Generate License" />
            <QuickActionBtn icon={<UserPlus size={16} />} label="Add Client" />
            <QuickActionBtn icon={<Upload size={16} />} label="Upload Update" />
            <QuickActionBtn icon={<RefreshCw size={16} />} label="Transfer License" />
            <QuickActionBtn icon={<Shield size={16} />} label="Revoke License" />
            <QuickActionBtn icon={<Monitor size={16} />} label="Offline Activation" />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pending updates</span>
              <span className="font-semibold text-orange-600">2 pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
