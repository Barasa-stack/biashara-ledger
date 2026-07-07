'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Shield, Mail, Key, Palette, Server, Database,
  FileText, LogOut, Save, Loader2, Eye, EyeOff,
  CheckCircle2, AlertTriangle, RefreshCw, Plus, Trash2
} from 'lucide-react';

type Tab = 'general' | 'branding' | 'smtp' | 'security' | 'plans' | 'payment' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
  { id: 'smtp', label: 'SMTP / Email', icon: <Mail size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'plans', label: 'Subscription Plans', icon: <FileText size={16} /> },
  { id: 'payment', label: 'Payment Gateway', icon: <Database size={16} /> },
  { id: 'audit', label: 'Audit Log', icon: <FileText size={16} /> },
];

type SmtpSettings = {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  company_name: string;
};

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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General settings
  const [general, setGeneral] = useState({
    platform_name: 'BiasharaLedger',
    support_email: 'support@biasharaledger.com',
    default_currency: 'KES',
    timezone: 'Africa/Nairobi (UTC+3)',
  });
  const [generalLoading, setGeneralLoading] = useState(false);

  // Branding
  const [branding, setBranding] = useState({
    primary_color: '#dc2626',
    logo_url: '',
    favicon_url: '',
  });

  // SMTP
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    company_name: 'BiasharaLedger',
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '' });

  // Payment
  const [payment, setPayment] = useState({
    provider: 'M-Pesa (Daraja API)',
    api_key: '',
    webhook_secret: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Audit
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadGeneral = useCallback(async () => {
    setGeneralLoading(true);
    try {
      const res = await fetch('/api/admin/settings/general');
      if (res.ok) {
        const data = await res.json();
        setGeneral({
          platform_name: data.platform_name || 'BiasharaLedger',
          support_email: data.support_email || 'support@biasharaledger.com',
          default_currency: data.default_currency || 'KES',
          timezone: data.timezone || 'Africa/Nairobi (UTC+3)',
        });
        setBranding({
          primary_color: data.primary_color || '#dc2626',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
        });
      }
    } catch {}
    setGeneralLoading(false);
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch('/api/admin/settings/plans');
      if (res.ok) setPlans(await res.json());
    } catch {}
    setPlansLoading(false);
  }, []);

  const loadPayment = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/admin/settings/payment');
      if (res.ok) setPayment(await res.json());
    } catch {}
    setPaymentLoading(false);
  }, []);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit-log');
      if (res.ok) setAuditLog(await res.json());
    } catch {}
    setAuditLoading(false);
  }, []);

  const loadSmtpSettings = useCallback(async () => {
    setSmtpLoading(true);
    setSmtpError('');
    try {
      const res = await fetch('/api/admin/settings/smtp');
      if (!res.ok) throw new Error('Failed to load SMTP settings');
      const data = await res.json();
      if (data.settings) {
        setSmtpSettings({
          smtp_host: data.settings.smtp_host || 'smtp.gmail.com',
          smtp_port: data.settings.smtp_port || '587',
          smtp_user: data.settings.smtp_user || '',
          smtp_pass: data.settings.smtp_pass || '',
          company_name: data.settings.company_name || 'BiasharaLedger',
        });
      }
    } catch (err: any) {
      setSmtpError(err.message);
    } finally {
      setSmtpLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'general':
      case 'branding':
        loadGeneral();
        break;
      case 'smtp':
        loadSmtpSettings();
        break;
      case 'security':
        fetch('/api/admin/settings/security')
          .then(r => r.ok ? r.json() : { enabled: false })
          .then(d => setTwoFactorEnabled(d.enabled))
          .catch(() => {});
        break;
      case 'plans':
        loadPlans();
        break;
      case 'payment':
        loadPayment();
        break;
      case 'audit':
        loadAuditLog();
        break;
    }
  }, [activeTab, loadGeneral, loadSmtpSettings, loadPlans, loadPayment, loadAuditLog]);

  const toggle2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !twoFactorEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch {}
    setTwoFactorLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      switch (activeTab) {
        case 'general':
        case 'branding': {
          await fetch('/api/admin/settings/general', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...general, ...branding }),
          });
          break;
        }
        case 'smtp': {
          const res = await fetch('/api/admin/settings/smtp', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp_host: smtpSettings.smtp_host,
              smtp_port: smtpSettings.smtp_port,
              smtp_user: smtpSettings.smtp_user,
              smtp_pass: smtpSettings.smtp_pass,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to save SMTP settings');
          }
          break;
        }
        case 'payment': {
          const res = await fetch('/api/admin/settings/payment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment),
          });
          if (!res.ok) throw new Error('Failed to save payment settings');
          break;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSmtpError(error.message);
      setTimeout(() => setSmtpError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSave = async () => {
    if (!planForm.name.trim() || !planForm.price) return;
    const action = editingPlan ? 'update' : 'create';
    const body: any = { action, name: planForm.name, price: parseFloat(planForm.price), description: planForm.description };
    if (editingPlan) body.id = editingPlan.id;
    await fetch('/api/admin/settings/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setShowPlanModal(false);
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', description: '' });
    loadPlans();
  };

  const handlePlanDelete = async (id: string) => {
    await fetch('/api/admin/settings/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    loadPlans();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar tabs */}
      <div className="lg:w-56 flex-shrink-0">
        <nav className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sticky top-24">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-light text-brand'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-brand' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <hr className="my-2 border-gray-100" />
          <button
            onClick={async () => {
              await fetch('/api/auth/signout', { method: 'POST' });
              router.push('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{activeTab} Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure your {activeTab} preferences</p>
            </div>
            {activeTab !== 'audit' && activeTab !== 'plans' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* ── GENERAL ── */}
          {activeTab === 'general' && (
            <div className="space-y-5 max-w-lg">
              {generalLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Platform Name</label>
                    <input type="text" value={general.platform_name}
                      onChange={e => setGeneral(g => ({ ...g, platform_name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Support Email</label>
                    <input type="email" value={general.support_email}
                      onChange={e => setGeneral(g => ({ ...g, support_email: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Currency</label>
                    <select value={general.default_currency}
                      onChange={e => setGeneral(g => ({ ...g, default_currency: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="TZS">TZS - Tanzanian Shilling</option>
                      <option value="UGX">UGX - Ugandan Shilling</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Time Zone</label>
                    <select value={general.timezone}
                      onChange={e => setGeneral(g => ({ ...g, timezone: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                      <option value="Africa/Nairobi (UTC+3)">Africa/Nairobi (UTC+3)</option>
                      <option value="Africa/Dar_es_Salaam (UTC+3)">Africa/Dar_es_Salaam (UTC+3)</option>
                      <option value="Africa/Kampala (UTC+3)">Africa/Kampala (UTC+3)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BRANDING ── */}
          {activeTab === 'branding' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={branding.primary_color}
                    onChange={e => setBranding(b => ({ ...b, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-gray-500">{branding.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Logo URL</label>
                <input type="text" value={branding.logo_url}
                  onChange={e => setBranding(b => ({ ...b, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Favicon URL</label>
                <input type="text" value={branding.favicon_url}
                  onChange={e => setBranding(b => ({ ...b, favicon_url: e.target.value }))}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {/* ── SMTP ── */}
          {activeTab === 'smtp' && (
            <div className="space-y-5 max-w-lg">
              {smtpError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle size={16} />
                  {smtpError}
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">All notifications, OTP emails, and automated emails use this SMTP configuration.</p>
                <button onClick={loadSmtpSettings} disabled={smtpLoading} className="text-blue-600 hover:text-blue-800">
                  <RefreshCw size={14} className={smtpLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Host</label>
                <input type="text" value={smtpSettings.smtp_host}
                  onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Port</label>
                  <input type="text" value={smtpSettings.smtp_port}
                    onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_port: e.target.value }))}
                    placeholder="587"
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Encryption</label>
                  <select
                    value={smtpSettings.smtp_port === '465' ? 'SSL' : smtpSettings.smtp_port === '587' ? 'TLS' : 'None'}
                    onChange={(e) => {
                      const port = e.target.value === 'SSL' ? '465' : e.target.value === 'TLS' ? '587' : '25';
                      setSmtpSettings(s => ({ ...s, smtp_port: port }));
                    }}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="TLS">TLS (587)</option>
                    <option value="SSL">SSL (465)</option>
                    <option value="None">None (25)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Username / Email</label>
                <input type="text" value={smtpSettings.smtp_user}
                  onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_user: e.target.value }))}
                  placeholder="smtp@example.com"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Password / App Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={smtpSettings.smtp_pass}
                    onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_pass: e.target.value }))}
                    placeholder="Enter app password"
                    className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">For Gmail, use an App Password (not your account password).</p>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="space-y-5 max-w-lg">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your admin account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={twoFactorEnabled} onChange={toggle2FA} disabled={twoFactorLoading} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Session Duration</label>
                <select defaultValue="24 hours" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="1 hour">1 hour</option>
                  <option value="4 hours">4 hours</option>
                  <option value="8 hours">8 hours</option>
                  <option value="24 hours">24 hours</option>
                  <option value="7 days">7 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" placeholder="New password" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {/* ── PLANS ── */}
          {activeTab === 'plans' && (
            <div className="space-y-4 max-w-lg">
              {plansLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  {plans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">${parseFloat(plan.price).toFixed(2)}/mo</p>
                        {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({ name: plan.name, price: String(plan.price), description: plan.description || '' });
                          setShowPlanModal(true);
                        }} className="text-sm text-brand hover:text-brand font-medium">Edit</button>
                        <button onClick={() => handlePlanDelete(plan.id)} className="text-sm text-red-500 hover:text-red-700">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    setEditingPlan(null);
                    setPlanForm({ name: '', price: '', description: '' });
                    setShowPlanModal(true);
                  }} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand border-2 border-dashed border-gray-200 rounded-lg hover:border-brand/30 hover:bg-brand-light transition-all">
                    <Plus size={16} /> Add Plan
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── PAYMENT ── */}
          {activeTab === 'payment' && (
            <div className="space-y-5 max-w-lg">
              {paymentLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Provider</label>
                    <select value={payment.provider}
                      onChange={e => setPayment(p => ({ ...p, provider: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                      <option value="M-Pesa (Daraja API)">M-Pesa (Daraja API)</option>
                      <option value="Stripe">Stripe</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Flutterwave">Flutterwave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                    <input type="password" value={payment.api_key}
                      onChange={e => setPayment(p => ({ ...p, api_key: e.target.value }))}
                      placeholder="Enter API key"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Webhook Secret</label>
                    <input type="password" value={payment.webhook_secret}
                      onChange={e => setPayment(p => ({ ...p, webhook_secret: e.target.value }))}
                      placeholder="Enter webhook secret"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── AUDIT LOG ── */}
          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              {auditLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">No audit log entries yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Action', 'Admin', 'IP Address', 'Timestamp'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLog.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.action}{entry.entity_type ? ` (${entry.entity_type})` : ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.admin_email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.ip_address || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{entry.created_at ? formatTimeAgo(entry.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Plan Editor Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 pb-10 overflow-y-auto" onClick={() => setShowPlanModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan Name</label>
                <input type="text" value={planForm.name}
                  onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Professional"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Price (USD/month)</label>
                <input type="number" step="0.01" min="0" value={planForm.price}
                  onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="9.99"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea value={planForm.description}
                  onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What's included..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <button onClick={handlePlanSave}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
