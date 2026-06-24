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

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/sign-in');
      else if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
        router.replace('/renew');
      } else {
        setReady(true);
      }
    }
  }, [user, loading, router]);

  const showUpgradeBanner = user && (user.subscriptionPlan === 'trial' || user.subscriptionPlan === 'Basic');

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
      {showUpgradeBanner && (
        <div className="bg-brand/5 border-b border-brand/20 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-700">
              {user.subscriptionPlan === 'trial'
                ? 'You\'re on a free trial. Upgrade to keep access to all features.'
                : 'You\'re on the Basic plan. Upgrade for HR, Payroll, Inventory & more.'}
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
