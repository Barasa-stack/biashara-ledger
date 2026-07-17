'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { loadSecuritySettings, saveSecuritySettings } from '@/lib/api/settings';

export default function SecurityTab() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    loadSecuritySettings().then((d: { enabled: boolean; setup_url: string; secret: string }) => {
      setEnabled(d.enabled);
      setSetupUrl(d.setup_url || '');
      setSecret(d.secret || '');
    }).catch(() => {});
  }, []);

  const handleEnable = useCallback(async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Enter a valid 6-digit code from your authenticator app');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await saveSecuritySettings({ action: 'enable', code: verifyCode });
      setEnabled(true);
      setShowSetup(false);
      setVerifyCode('');
      setMessage(data.message || '2FA enabled successfully');
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    }
    setLoading(false);
  }, [verifyCode]);

  const handleDisable = useCallback(async () => {
    if (!disablePassword) {
      setError('Enter your password to disable 2FA');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await saveSecuritySettings({ action: 'disable', password: disablePassword });
      setEnabled(false);
      setShowDisable(false);
      setDisablePassword('');
      setMessage(data.message || '2FA disabled successfully');
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    }
    setLoading(false);
  }, [disablePassword]);

  return (
    <div className="space-y-5 max-w-lg">
      {message && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {enabled
              ? 'Your account is protected with an authenticator app'
              : 'Add an extra layer of security to your admin account'}
          </p>
        </div>
        {enabled ? (
          <button
            onClick={() => { setShowDisable(true); setError(''); }}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={() => { setShowSetup(true); setError(''); }}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Enable'}
          </button>
        )}
      </div>

      {showSetup && !enabled && (
        <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 mb-3">Scan with Authenticator App</p>
            {setupUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupUrl)}`}
                alt="QR Code for 2FA setup"
                className="mx-auto w-48 h-48 border border-gray-200 rounded-lg"
              />
            )}
            <p className="text-xs text-gray-500 mt-3">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Or enter this key manually:</p>
            <p className="text-sm font-mono font-bold text-gray-800 tracking-wider select-all">
              {secret}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2.5 text-center text-lg tracking-[0.3em] font-mono bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the 6-digit code from your authenticator app to verify
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowSetup(false); setVerifyCode(''); setError(''); }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEnable}
              disabled={loading || verifyCode.length !== 6}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {showDisable && enabled && (
        <div className="space-y-4 p-4 bg-white border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-gray-900">Disable Two-Factor Authentication</p>
          <p className="text-xs text-gray-500">Enter your password to confirm disabling 2FA.</p>
          <input
            type="password"
            placeholder="Enter your password"
            value={disablePassword}
            onChange={e => setDisablePassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setShowDisable(false); setDisablePassword(''); setError(''); }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable}
              disabled={loading || !disablePassword}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

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
  );
}
