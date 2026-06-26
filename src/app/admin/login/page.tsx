'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (data.success) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'digitalbaroz@gmail.com';
        if (data.user?.email !== adminEmail) {
          setError('Access denied. This panel is for administrators only.');
          setLoading(false);
          return;
        }
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Network error. Could not connect to server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand/25">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BiasharaLedger</h1>
          <p className="text-white/50 text-sm">Enterprise Accounting Platform</p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Clients', value: 'Manage' },
              { label: 'Licenses', value: 'Oversee' },
              { label: 'Updates', value: 'Push' },
              { label: 'Analytics', value: 'Monitor' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-white/40">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-8">Authorized administrators only</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">BiasharaLedger</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              &larr; Back to main site
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              Secured with AES-256-GCM encryption &bull; SOC 2 compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
