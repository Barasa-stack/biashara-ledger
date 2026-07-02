'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  country?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiry?: string;
  verified?: boolean;
  licenseStatus?: string;
  licenseKey?: string | null;
  trialEndDate?: string | null;
  trialDaysRemaining?: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, phone: string, firstName?: string, lastName?: string, otp?: string, selectedPackage?: string, country?: string) => Promise<{ success: boolean; error?: string; requiresPackageSelection?: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => Promise<void>;
  sendOtp: (email: string, purpose?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, code: string, purpose?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string, otp: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const maxRetries = 2;

    function check() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      fetch('/api/auth/me', {
        signal: controller.signal,
        credentials: 'include',
      })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.user) {
            setUser(data.user);
            setLoading(false);
          } else if (retries < maxRetries) {
            retries++;
            setTimeout(check, 1000);
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (retries < maxRetries) {
            retries++;
            setTimeout(check, 1000);
          } else {
            setLoading(false);
          }
        })
        .finally(() => clearTimeout(timeout));
    }

    check();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        router.refresh();
        return { success: true };
      }
      return { success: false, error: data.error || 'Sign in failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, phone: string, firstName?: string, lastName?: string, otp?: string, selectedPackage?: string, country?: string): Promise<{ success: boolean; error?: string; requiresPackageSelection?: boolean }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, phone, firstName, lastName, otp, selectedPackage, country }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        router.refresh();
        return { success: true };
      }
      return { success: false, error: data.error || 'Sign up failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch {}
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      window.location.href = '/sign-in';
    } else {
      window.location.href = '/';
    }
  }, []);

  const updateProfile = useCallback(async (data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => {
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch {}
  }, []);

  const sendOtp = useCallback(async (email: string, purpose = 'signup'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: data.error || 'Failed to send code' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string, purpose = 'signup'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose }),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: data.error || 'Invalid code' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, otp }),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: data.error || 'Reset failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, updateProfile, sendOtp, verifyOtp, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
