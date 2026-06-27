'use client';

import { Suspense, useEffect, useState, Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message || 'An unexpected error occurred' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-brand font-medium mb-2">Something went wrong</p>
            <p className="text-sm text-gray-600">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
              className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseMsg, setLicenseMsg] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/sign-in');
      } else if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
        router.replace('/renew');
      } else {
        setReady(true);
        if (user.licenseStatus === 'expired' || (user.licenseStatus === 'trial' && user.trialDaysRemaining !== undefined && user.trialDaysRemaining <= 0)) {
          setShowLicenseModal(true);
        }
      }
    }
  }, [user, loading, router]);

  const showUpgradeBanner = user && user.subscriptionPlan !== 'Premium';
  const trialDaysLeft = user?.trialDaysRemaining ?? 0;
  const showTrialBanner = user?.licenseStatus === 'trial' && trialDaysLeft > 0 && trialDaysLeft <= 3;

  async function handleActivateLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseKey.trim()) { setLicenseMsg('Please enter a license key'); return; }
    setActivating(true);
    setLicenseMsg('');
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim(), userEmail: user?.email }),
      });
      const data = await res.json();
      if (data.success) {
        setLicenseMsg('License activated successfully!');
        setTimeout(() => {
          setShowLicenseModal(false);
          window.location.reload();
        }, 1200);
      } else {
        setLicenseMsg(data.error || 'Activation failed');
      }
    } catch { setLicenseMsg('Connection failed'); }
    setActivating(false);
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand animate-pulse" />
          <span className="text-sm text-gray-800">Loading BiasharaLedger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBar />

      {/* License Activation Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">License Activation</h2>
              <p className="text-sm text-gray-500 mt-1">Your trial has expired. Enter a license key to continue.</p>
            </div>

            <form onSubmit={handleActivateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">License Key</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={e => setLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {licenseMsg && (
                <div className={`text-xs px-3 py-2 rounded-lg ${licenseMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {licenseMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="w-full py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                {activating ? 'Activating...' : 'Activate License'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link href="https://biashara-ledger.vercel.app/pricing" className="text-sm text-brand font-medium hover:underline">
                Don&apos;t have a license? Purchase Now
              </Link>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                License keys are linked to your email address. One license per user. License works offline after activation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Countdown Banner */}
      {showTrialBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">{trialDaysLeft} day(s)</span> remaining in your free trial.{' '}
              <Link href="/dashboard/subscription" className="underline font-medium">Upgrade now</Link> to keep access.
            </p>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-brand hover:text-gray-800 transition-colors"
            >
              Upgrade Now &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Upgrade Banner */}
      {showUpgradeBanner && !showTrialBanner && (
        <div className="bg-brand/5 border-b border-brand/20 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-700">
              {user.subscriptionPlan === 'trial'
                ? 'You\'re on a free trial. Upgrade to keep access to all features.'
                : `You're on the ${user.subscriptionPlan} plan. Upgrade for more features.`}
            </p>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-brand hover:text-gray-800 transition-colors"
            >
              Upgrade Now &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <Suspense fallback={<aside className="w-60 border-r border-dark-border bg-dark" />}>
          <Sidebar />
        </Suspense>
        <ErrorBoundary>
          <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
}
