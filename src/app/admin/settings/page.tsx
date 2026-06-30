'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Shield, Mail, Key, Palette, Server, Database,
  Bell, Users, FileText, LogOut, Save, Loader2, Eye, EyeOff,
  CheckCircle2, AlertTriangle, RefreshCw
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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: 'evanromanoff@gmail.com',
    smtp_pass: '',
    company_name: 'BiasharaLedger',
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          smtp_user: data.settings.smtp_user || 'evanromanoff@gmail.com',
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
    if (activeTab === 'smtp') {
      loadSmtpSettings();
    }
  }, [activeTab, loadSmtpSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'smtp') {
        const response = await fetch('/api/admin/settings/smtp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp_host: smtpSettings.smtp_host,
            smtp_port: smtpSettings.smtp_port,
            smtp_user: smtpSettings.smtp_user,
            smtp_pass: smtpSettings.smtp_pass,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save SMTP settings');
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSmtpError(error.message);
    } finally {
      setSaving(false);
    }
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
              await fetch('/api/auth/logout', { method: 'POST' });
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'general' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Platform Name</label>
                <input type="text" defaultValue="BiasharaLedger" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Support Email</label>
                <input type="email" defaultValue="support@biasharaledger.com" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Currency</label>
                <select className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>KES - Kenyan Shilling</option>
                  <option>USD - US Dollar</option>
                  <option>TZS - Tanzanian Shilling</option>
                  <option>UGX - Ugandan Shilling</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Time Zone</label>
                <select className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>Africa/Nairobi (UTC+3)</option>
                  <option>Africa/Dar_es_Salaam (UTC+3)</option>
                  <option>Africa/Kampala (UTC+3)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xl">BL</div>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Upload New</button>
                  <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" defaultValue="#059669" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-gray-500">#059669</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">BL</div>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Upload</button>
                </div>
              </div>
            </div>
          )}

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
                <input
                  type="text"
                  value={smtpSettings.smtp_host}
                  onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Port</label>
                  <input
                    type="text"
                    value={smtpSettings.smtp_port}
                    onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_port: e.target.value }))}
                    placeholder="587"
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Encryption</label>
                  <select
                    value={smtpSettings.smtp_port === '465' ? 'SSL' : smtpSettings.smtp_port === '587' ? 'TLS' : 'None'}
                    onChange={(e) => {
                      const port = e.target.value === 'SSL' ? '465' : e.target.value === 'TLS' ? '587' : '25';
                      setSmtpSettings(s => ({ ...s, smtp_port: port }));
                    }}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="TLS">TLS (587)</option>
                    <option value="SSL">SSL (465)</option>
                    <option value="None">None (25)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Username / Email</label>
                <input
                  type="text"
                  value={smtpSettings.smtp_user}
                  onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_user: e.target.value }))}
                  placeholder="evanromanoff@gmail.com"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Password / App Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpSettings.smtp_pass}
                    onChange={(e) => setSmtpSettings(s => ({ ...s, smtp_pass: e.target.value }))}
                    placeholder="Enter app password"
                    className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">For Gmail, use an App Password (not your account password).</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5 max-w-lg">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your admin account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Session Duration</label>
                <select className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                  <option selected>24 hours</option>
                  <option>7 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" placeholder="New password" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4 max-w-lg">
              {['Basic', 'Standard', 'Premium'].map(plan => (
                <div key={plan} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{plan}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{plan === 'Basic' ? 'KES 1,500/mo' : plan === 'Standard' ? 'KES 3,000/mo' : 'KES 5,000/mo'}</p>
                  </div>
                  <button className="text-sm text-brand hover:text-brand font-medium">Edit</button>
                </div>
              ))}
              <button className="w-full px-4 py-3 text-sm font-medium text-brand border-2 border-dashed border-gray-200 rounded-lg hover:border-brand/30 hover:bg-brand-light transition-all">
                + Add Plan
              </button>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Provider</label>
                <select className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>M-Pesa (Daraja API)</option>
                  <option>Stripe</option>
                  <option>PayPal</option>
                  <option>Flutterwave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                <input type="password" defaultValue="sk_live_••••••••••••" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Webhook Secret</label>
                <input type="password" defaultValue="whsec_••••••••••••" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Action', 'Admin', 'IP Address', 'Timestamp'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { action: 'Login', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '2 min ago' },
                    { action: 'License Generated: BL-2026-X9K2', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '15 min ago' },
                    { action: 'Client Created: Safari Inc.', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '1 hour ago' },
                    { action: 'License Revoked: BL-2026-ZZ99', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '3 hours ago' },
                    { action: 'Update Published: v2.4.0', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '1 day ago' },
                    { action: 'Settings Changed: SMTP Config', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '2 days ago' },
                    { action: 'Logout', admin: 'admin@biashara.com', ip: '192.168.1.1', time: '3 days ago' },
                  ].map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.action}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.admin}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.ip}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
