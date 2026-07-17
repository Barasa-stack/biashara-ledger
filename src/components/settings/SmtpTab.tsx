'use client';

import { Eye, EyeOff, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { SmtpSettings } from '@/types/settings';

type Props = {
  settings: SmtpSettings;
  onChange: (settings: SmtpSettings) => void;
  loading: boolean;
  locked: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  error: string;
  onRefresh: () => void;
};

export default function SmtpTab({ settings, onChange, loading, locked, showPassword, onTogglePassword, error, onRefresh }: Props) {
  return (
    <div className="space-y-5 max-w-lg">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">All notifications, OTP emails, and automated emails use this SMTP configuration.</p>
        <button onClick={onRefresh} disabled={loading} className="text-blue-600 hover:text-blue-800">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {locked && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Admin SMTP settings are locked. Only Super Admin can change them.</p>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Host</label>
        <input type="text" value={settings.smtp_host}
          onChange={(e) => onChange({ ...settings, smtp_host: e.target.value })}
          placeholder="smtp.gmail.com"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Port</label>
        <input type="text" value={settings.smtp_port}
          onChange={(e) => onChange({ ...settings, smtp_port: e.target.value })}
          placeholder="587"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Username / Email</label>
        <input type="text" value={settings.smtp_user}
          onChange={(e) => onChange({ ...settings, smtp_user: e.target.value })}
          placeholder="smtp@example.com"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">SMTP Password / App Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={settings.smtp_pass}
            onChange={(e) => onChange({ ...settings, smtp_pass: e.target.value })}
            placeholder="Enter app password"
            className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
          <button type="button" onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">For Gmail, use an App Password (not your account password).</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">From Name</label>
        <input type="text" value={settings.smtp_from_name}
          onChange={(e) => onChange({ ...settings, smtp_from_name: e.target.value })}
          placeholder="BiasharaLedger"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">From Address</label>
        <input type="text" value={settings.smtp_from_address}
          onChange={(e) => onChange({ ...settings, smtp_from_address: e.target.value })}
          placeholder="noreply@biasharaledger.com"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
        <p className="text-xs text-gray-400 mt-1">Defaults to SMTP username if left empty.</p>
      </div>
    </div>
  );
}
