'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ActivationSuccessPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(async () => {
      await refreshUser();
      router.push('/dashboard');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-sm mx-auto p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Subscription Activated!</h1>
        <p className="text-sm text-gray-600 mb-6">Your license is active. Redirecting to dashboard...</p>
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
