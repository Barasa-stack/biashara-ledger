'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader, Shield, Key } from 'lucide-react';

type ActivationProps = {
  onActivated?: (data: any) => void;
  onSkip?: () => void;
};

export default function LicenseActivation({ onActivated, onSkip }: ActivationProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [step, setStep] = useState<'idle' | 'activating' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  const formatKey = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const groups = [];
    for (let i = 0; i < cleaned.length && groups.length < 4; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    return groups.join('-');
  };

  const handleActivate = async () => {
    if (!licenseKey || licenseKey.replace(/-/g, '').length < 16) {
      setError('Please enter a valid license key');
      return;
    }
    setStep('activating');
    setError('');

    try {
      const hwFingerprint = await getHardwareFingerprint();
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, hardwareFingerprint: hwFingerprint }),
      });
      const data = await res.json();

      if (data.success) {
        setLicenseInfo(data);
        setStep('success');
        localStorage.setItem('bl_license', JSON.stringify(data));
        setTimeout(() => onActivated?.(data), 2000);
      } else {
        setError(data.error || 'Activation failed');
        setStep('error');
      }
    } catch {
      setError('Network error. Please check your connection.');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-brand-hover p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Activate BiasharaLedger</h2>
          <p className="text-sm text-white/70 mt-1">Enter your license key to activate</p>
        </div>

        <div className="p-6 space-y-5">
          {step === 'success' && licenseInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600 bg-green-50 rounded-lg p-4">
                <CheckCircle className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-semibold">License Activated!</p>
                  <p className="text-sm text-green-700">{licenseInfo.licenseType} plan</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">License Type</span><span className="font-medium capitalize">{licenseInfo.licenseType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Expiry</span><span className="font-medium">{licenseInfo.expiryDate ? new Date(licenseInfo.expiryDate).toLocaleDateString() : 'Lifetime'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Features</span><span className="font-medium">{(licenseInfo.features || []).join(', ') || 'All'}</span></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <Loader className="h-4 w-4 animate-spin" />
                Launching application...
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <Key className="h-5 w-5 shrink-0" />
                <span>Your license key was sent to your email after purchase.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">License Key</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={e => { setLicenseKey(formatKey(e.target.value)); setError(''); }}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  disabled={step === 'activating'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">Format: XXXX-XXXX-XXXX-XXXX</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {step === 'activating' && (
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                  <Loader className="h-5 w-5 animate-spin text-brand" />
                  <span>Activating license, please wait...</span>
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={!licenseKey || step === 'activating'}
                className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-lg transition-colors"
              >
                {step === 'activating' ? 'Activating...' : 'Activate License'}
              </button>

              {onSkip && (
                <div className="text-center">
                  <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    Skip activation (start trial)
                  </button>
                </div>
              )}

              <div className="text-center text-xs text-gray-400 space-y-1">
                <p>Don&apos;t have a license? <a href="/pricing" className="text-brand hover:underline">Purchase one</a></p>
                <p>Need help? <a href="/contact" className="text-brand hover:underline">Contact support</a></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

async function getHardwareFingerprint(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return await (window as any).electronAPI.getHardwareFingerprint?.() || 'browser-' + navigator.userAgent;
  }
  const components = [navigator.userAgent, navigator.language, screen.width, screen.height, navigator.hardwareConcurrency];
  const str = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
