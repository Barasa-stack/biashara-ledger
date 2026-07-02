'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  const [reloadAttempted, setReloadAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchFreshUser() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/sign-in');
            return;
          }
          throw new Error(`Server responded with ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          if (setUser) setUser(data.user);
          setLocalLoading(false);
        }
      } catch (err) {
        console.error('Dashboard: Failed to fetch user', err);
        if (isMounted && !reloadAttempted) {
          setReloadAttempted(true);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setLocalLoading(false);
        }
      }
    }

    if (!authLoading) {
      fetchFreshUser();
    } else {
      const timer = setTimeout(() => {
        if (localLoading && !reloadAttempted) {
          fetchFreshUser();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    const timeoutId = setTimeout(() => {
      if (isMounted && localLoading && !reloadAttempted) {
        setReloadAttempted(true);
        window.location.reload();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [authLoading, localLoading, reloadAttempted, router, setUser]);

  useEffect(() => {
    if (!authLoading && !localLoading && user) {
      if (user.subscription_status !== 'active') {
        router.push('/renew');
      }
    }
  }, [authLoading, localLoading, user, router]);

  if (authLoading || localLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BiasharaLedger...</p>
        </div>
      </div>
    );
  }

  // --- YOUR EXISTING DASHBOARD UI GOES HERE ---
  // Replace the content below with your actual dashboard UI.
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome back, {user?.name || user?.email}!</p>
      <p>Subscription: <span className="font-semibold">{user?.subscription_status}</span></p>
      <p>Plan: {user?.subscription_plan}</p>
      {/* Paste your dashboard content here */}
    </div>
  );
}
