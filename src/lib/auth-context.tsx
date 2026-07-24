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
  allowedModules?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; requires_otp?: boolean; email?: string }>;
  completeOtpSignIn: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, phone: string, firstName?: string, lastName?: string, otp?: string, selectedPackage?: string, country?: string) => Promise<{ success: boolean; error?: string; requiresPackageSelection?: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => Promise<void>;
  sendOtp: (email: string, purpose?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, code: string, purpose?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string, otp: string) => Promise<{ success: boolean; error?: string }>;
};

async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  if ((window as any).electronAPI?.getHardwareFingerprint) {
    return (window as any).electronAPI.getHardwareFingerprint();
  }
  const components = [
    navigator.userAgent, navigator.language,
    screen.width, screen.height,
    navigator.hardwareConcurrency,
  ];
  const str = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getDeviceInfo(): string {
  if (typeof window === 'undefined') return '';
  const parts: string[] = [];
  parts.push(`platform=${navigator.platform}`);
  parts.push(`lang=${navigator.language}`);
  parts.push(`cookies=${navigator.cookieEnabled}`);
  if ((navigator as any).deviceMemory) parts.push(`ram=${(navigator as any).deviceMemory}GB`);
  if ((navigator as any).connection?.effectiveType) parts.push(`net=${(navigator as any).connection.effectiveType}`);
  return parts.join('; ');
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

async function startTracking() {
  try {
    const fp = await getDeviceFingerprint();
    await fetch('/api/track/session-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ deviceFingerprint: fp, deviceInfo: getDeviceInfo() }),
    });
  } catch { /* best-effort */ }

  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    try {
      await fetch('/api/track/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activeSeconds: 60 }),
      });
    } catch { /* best-effort */ }
  }, 60000);
}

async function stopTracking() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  try {
    await fetch('/api/track/session-end', {
      method: 'POST',
      credentials: 'include',
    });
  } catch { /* best-effort */ }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const maxRetries = 2;
    const maxTotalTimeoutMs = 15000;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const totalTimeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthProvider] Max total initialization timeout reached, forcing loading=false');
        cancelled = true;
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        setLoading(false);
      }
    }, maxTotalTimeoutMs);

    function check() {
      if (cancelled) return;
      const controller = new AbortController();
      const abortTimeoutId = setTimeout(() => {
        if (!cancelled) controller.abort();
      }, 4000);

      fetch('/api/auth/me', {
        signal: controller.signal,
        credentials: 'include',
      })
        .then(r => {
          if (cancelled) return null;
          return r.json();
        })
        .then(data => {
          if (cancelled || !data) return;
          if (data.user) {
            setUser(data.user);
            setLoading(false);
            startTracking();
          } else if (retries < maxRetries) {
            retries++;
            retryTimeoutId = setTimeout(check, 1000);
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (retries < maxRetries) {
            retries++;
            retryTimeoutId = setTimeout(check, 1000);
          } else {
            setLoading(false);
          }
        })
        .finally(() => clearTimeout(abortTimeoutId));
    }

    check();

    const refreshInterval = setInterval(() => {
      if (!cancelled) {
        fetch('/api/auth/me', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            if (!cancelled && data.user) {
              setUser(data.user);
            }
          })
          .catch(() => {});
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearTimeout(totalTimeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; requires_otp?: boolean; email?: string }> => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires_otp) {
          return { success: true, requires_otp: true, email: data.email };
        }
        setUser(data.user || null);
        setLoading(false);
        router.refresh();
        startTracking();
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: data.error || 'Sign in failed' };
    } catch {
      setLoading(false);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [router]);

  const completeOtpSignIn = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose: 'signin_2fa' }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user || null);
        setLoading(false);
        router.refresh();
        startTracking();
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: data.error || 'Verification failed' };
    } catch {
      setLoading(false);
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
        setUser(data.user || null);
        setLoading(false);
        router.refresh();
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: data.error || 'Sign up failed' };
    } catch {
      setLoading(false);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch {}
  }, []);

  const signOut = useCallback(async () => {
    await stopTracking();
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {}
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
    <AuthContext.Provider value={{ user, loading, signIn, completeOtpSignIn, signUp, signOut, refreshUser, updateProfile, sendOtp, verifyOtp, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
