'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, Shield, X, Save, Eye, EyeOff, KeyRound, Smartphone, Mail, Check, ArrowLeft, Send, Lock, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function TopBar() {
  const { user, signOut, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'edit' | 'security' | 'profile'>('menu');
  const ref = useRef<HTMLDivElement>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [security, setSecurity] = useState({ twoStep: false, currentPassword: '', newPassword: '', showCurrent: false, showNew: false });
  const [twoStepStep, setTwoStepStep] = useState<'off' | 'choose_method' | 'enter_phone' | 'verify_phone' | 'phone_verified' | 'enter_email' | 'verify_email' | 'email_verified' | 'choose_triggers' | 'complete'>('off');
  const [twoStepData, setTwoStepData] = useState({ phone: '', email: '', code: '', triggers: { newBrowser: true, newDevice: true, newIp: true, everyLogin: false } });
  const [pwStep, setPwStep] = useState<'current' | 'otp' | 'newpw'>('current');
  const [pwOtp, setPwOtp] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const triggerLabels: Record<string, string> = {
    newBrowser: 'New browser login',
    newDevice: 'New device',
    newIp: 'New IP address',
    everyLogin: 'Every login (highest security)',
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView('menu');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function openDropdown() {
    setOpen(!open);
    setView('menu');
  }

  function openEdit() {
    setEditForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
    setView('edit');
  }

  function saveEdit() {
    updateProfile({ firstName: editForm.firstName, lastName: editForm.lastName, email: editForm.email, phone: editForm.phone });
    setView('menu');
  }

  function openSecurity() {
    setSecurity({ twoStep: false, currentPassword: '', newPassword: '', showCurrent: false, showNew: false });
    setTwoStepStep('off');
    setTwoStepData({ phone: '', email: '', code: '', triggers: { newBrowser: true, newDevice: true, newIp: true, everyLogin: false } });
    setPwStep('current');
    setPwOtp('');
    setPwError('');
    setPwMsg('');
    setView('security');
  }

  function handleTwoStepToggle() {
    if (security.twoStep) {
      setSecurity(p => ({ ...p, twoStep: false }));
      setTwoStepStep('off');
    } else {
      setTwoStepStep('choose_method');
    }
  }

  function resetTwoStep() {
    setTwoStepStep('off');
    setTwoStepData({ phone: '', email: '', code: '', triggers: { newBrowser: true, newDevice: true, newIp: true, everyLogin: false } });
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const initial = (user?.firstName || user?.email || 'U')[0].toUpperCase();

  function renderSecurity() {
    return (
      <div>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
          <button onClick={() => setView('menu')} className="text-xs text-white hover:text-brand transition-colors">← Back</button>
          <span className="text-sm font-medium text-white">Security</span>
        </div>
        <div className="px-4 py-4 space-y-4">

          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Two-Step Authentication</p>
              <p className="text-xs text-white/60">Add an extra layer of security</p>
            </div>
            <button
              onClick={handleTwoStepToggle}
              className={`relative w-10 h-5 rounded-full transition-colors ${security.twoStep || twoStepStep !== 'off' ? 'bg-brand' : 'bg-dark-hover'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${security.twoStep || twoStepStep !== 'off' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>

          {(twoStepStep !== 'off' || security.twoStep) && (
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333333] p-4 space-y-3">

              {twoStepStep === 'choose_method' && (
                <div className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Choose how to receive verification codes:</p>
                  <button onClick={() => setTwoStepStep('enter_phone')} className="w-full flex items-center gap-3 bg-dark-border hover:bg-dark-hover rounded-lg px-3 py-3 transition-colors text-left">
                    <Smartphone className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-sm text-white font-medium">Phone</p>
                      <p className="text-xs text-white/60">Receive codes via SMS</p>
                    </div>
                  </button>
                  <button onClick={() => setTwoStepStep('enter_email')} className="w-full flex items-center gap-3 bg-dark-border hover:bg-dark-hover rounded-lg px-3 py-3 transition-colors text-left">
                    <Mail className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-sm text-white font-medium">Email</p>
                      <p className="text-xs text-white/60">Receive codes via email</p>
                    </div>
                  </button>
                  <button onClick={resetTwoStep} className="text-xs text-white/60 hover:text-white pt-1">Cancel setup</button>
                </div>
              )}

              {twoStepStep === 'enter_phone' && (
                <div key="enter-phone" className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Enter your phone number</p>
                  <input
                    value={twoStepData.phone}
                    onChange={e => setTwoStepData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+254 712 345 678"
                    autoComplete="tel"
                    name="two-step-phone"
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setTwoStepStep('choose_method')} className="flex-1 bg-dark-border text-white rounded-lg px-3 py-2 text-sm hover:bg-dark-hover transition-colors">Back</button>
                    <button onClick={() => setTwoStepStep('verify_phone')} className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
                      <Send className="h-3.5 w-3.5" /> Send Code
                    </button>
                  </div>
                </div>
              )}

              {twoStepStep === 'verify_phone' && (
                <div className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Enter the 4-digit code sent to {twoStepData.phone || 'your phone'}</p>
                  <input
                    value={twoStepData.code}
                    onChange={e => setTwoStepData(p => ({ ...p, code: e.target.value }))}
                    placeholder="0 0 0 0"
                    maxLength={4}
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setTwoStepStep('enter_phone')} className="flex-1 bg-dark-border text-white rounded-lg px-3 py-2 text-sm hover:bg-dark-hover transition-colors">Back</button>
                    <button onClick={() => setTwoStepStep('choose_triggers')} className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
                      <Check className="h-3.5 w-3.5" /> Verify
                    </button>
                  </div>
                </div>
              )}

              {twoStepStep === 'enter_email' && (
                <div key="enter-email" className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Enter your email address</p>
                  <input
                    value={twoStepData.email}
                    onChange={e => setTwoStepData(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@company.co.ke"
                    autoComplete="email"
                    name="two-step-email"
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setTwoStepStep('choose_method')} className="flex-1 bg-dark-border text-white rounded-lg px-3 py-2 text-sm hover:bg-dark-hover transition-colors">Back</button>
                    <button onClick={() => setTwoStepStep('verify_email')} className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
                      <Send className="h-3.5 w-3.5" /> Send Code
                    </button>
                  </div>
                </div>
              )}

              {twoStepStep === 'verify_email' && (
                <div className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Enter the 4-digit code sent to {twoStepData.email || 'your email'}</p>
                  <input
                    value={twoStepData.code}
                    onChange={e => setTwoStepData(p => ({ ...p, code: e.target.value }))}
                    placeholder="0 0 0 0"
                    maxLength={4}
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setTwoStepStep('enter_email')} className="flex-1 bg-dark-border text-white rounded-lg px-3 py-2 text-sm hover:bg-dark-hover transition-colors">Back</button>
                    <button onClick={() => setTwoStepStep('choose_triggers')} className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
                      <Check className="h-3.5 w-3.5" /> Verify
                    </button>
                  </div>
                </div>
              )}

              {twoStepStep === 'choose_triggers' && (
                <div className="space-y-3">
                  <p className="text-xs text-white/80 font-medium">Require verification code when:</p>
                  <div className="space-y-2">
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(twoStepData.triggers as any)[key]}
                          onChange={() => setTwoStepData(p => ({ ...p, triggers: { ...p.triggers, [key]: !(p.triggers as any)[key] } }))}
                          className="accent-brand"
                        />
                        <span className="text-sm text-white">{label}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={() => { setSecurity(p => ({ ...p, twoStep: true })); setTwoStepStep('complete'); }} className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors mt-2">
                    <Lock className="h-4 w-4" /> Enable Two-Step
                  </button>
                </div>
              )}

              {twoStepStep === 'complete' && (
                <div className="text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-brand" />
                  </div>
                  <p className="text-sm text-white font-medium">Two-Step Enabled</p>
                  <p className="text-xs text-white/60 mt-1">Verification codes will be required for selected triggers.</p>
                  <button onClick={resetTwoStep} className="text-xs text-brand hover:text-white mt-3 transition-colors">Manage settings</button>
                </div>
              )}

              {security.twoStep && twoStepStep === 'off' && (
                <div className="text-center py-1">
                  <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-4 w-4 text-brand" />
                  </div>
                  <p className="text-xs text-white/80">Two-step authentication is active</p>
                  <button onClick={() => setTwoStepStep('choose_method')} className="text-xs text-brand hover:text-white mt-2 transition-colors">Change method</button>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-dark-border pt-4 space-y-3">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Change Password</p>

            {pwMsg && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{pwMsg}</p>}
            {pwError && <p className="text-xs text-brand bg-brand/10 px-3 py-2 rounded-lg">{pwError}</p>}

            {pwStep === 'current' && (
              <div>
                <label className="block text-xs text-white/60 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={security.showCurrent ? 'text' : 'password'}
                    value={security.currentPassword}
                    onChange={e => setSecurity(p => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button onClick={() => setSecurity(p => ({ ...p, showCurrent: !p.showCurrent }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {security.showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/auth/verify-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: security.currentPassword }),
                    });
                    if (!res.ok) {
                      setPwError('Current password is incorrect.');
                      return;
                    }
                    setPwError('');
                    try {
                      const otpRes = await fetch('/api/auth/send-signup-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user!.email, purpose: 'password_reset' }),
                      });
                      const otpData = await otpRes.json();
                      setPwMsg(otpRes.ok
                        ? `A code has been sent to ${user!.email}`
                        : (otpData.error || 'Failed to send code'));
                    } catch {
                      setPwMsg('Failed to send code');
                    }
                    setPwStep('otp');
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors"
                >
                  <Send className="h-4 w-4" /> Send OTP
                </button>
              </div>
            )}

            {pwStep === 'otp' && (
              <div>
                <label className="block text-xs text-white/60 mb-1">Enter 4-Digit Code</label>
                <input
                  type="text"
                  value={pwOtp}
                  onChange={e => setPwOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0 0 0 0"
                  maxLength={4}
                  className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setPwStep('current'); setPwError(''); setPwMsg(''); }} className="flex-1 bg-dark-border text-white rounded-lg px-3 py-2 text-sm hover:bg-dark-hover transition-colors">Back</button>
                  <button
                    onClick={async () => {
                      try {
                        const otpRes = await fetch('/api/auth/verify-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: user!.email, code: pwOtp, purpose: 'password_reset' }),
                        });
                        if (otpRes.ok) {
                          setPwError('');
                          setPwMsg('');
                          setPwStep('newpw');
                        } else {
                          setPwError('Invalid or expired code.');
                        }
                      } catch {
                        setPwError('Invalid or expired code.');
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-hover transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Verify
                  </button>
                </div>
              </div>
            )}

            {pwStep === 'newpw' && (
              <div>
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg mb-3">
                  <Check className="h-3.5 w-3.5 shrink-0" /> Code verified
                </div>
                <label className="block text-xs text-white/60 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={security.showNew ? 'text' : 'password'}
                    value={security.newPassword}
                    onChange={e => setSecurity(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button onClick={() => setSecurity(p => ({ ...p, showNew: !p.showNew }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {security.showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (security.newPassword.length < 8 || !/[A-Z]/.test(security.newPassword) || !/[0-9]/.test(security.newPassword)) {
                      setPwError('Password must be at least 8 characters with an uppercase letter and a number');
                      return;
                    }
                    try {
                      const res = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentPassword: security.currentPassword, newPassword: security.newPassword }),
                      });
                      if (res.ok) {
                        setPwError('');
                        setPwMsg('Password updated successfully.');
                        setPwStep('current');
                        setSecurity(p => ({ ...p, currentPassword: '', newPassword: '' }));
                        setPwOtp('');
                      } else {
                        const data = await res.json();
                        setPwError(data.error || 'Failed to update password');
                      }
                    } catch {
                      setPwError('Network error. Please try again.');
                    }
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors"
                >
                  <KeyRound className="h-4 w-4" /> Update Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="h-16 bg-dark border-b border-dark-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
          <span className="text-white font-bold text-sm">BL</span>
        </div>
        <h1 className="text-base font-bold text-white leading-tight">BiasharaLedger</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand/10 border border-brand/30 text-brand text-[11px] font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Live Ledger
        </span>

        <div className="relative" ref={ref}>
          <div
            onClick={openDropdown}
            className="w-8 h-8 rounded-full bg-brand border-2 border-brand/50 flex items-center justify-center cursor-pointer hover:border-brand transition-all select-none"
          >
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>

          {open && (
            <div className="absolute right-0 top-10 w-72 bg-dark border border-dark-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              {view === 'menu' && (
                <div>
                  <div className="px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-xs text-white/60 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => setView('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-brand/10 transition-colors text-left">
                      <User className="h-4 w-4 text-brand" />
                      View Profile
                    </button>
                    <button onClick={openEdit} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-brand/10 transition-colors text-left">
                      <Settings className="h-4 w-4 text-brand" />
                      Edit Profile
                    </button>
                    <button onClick={openSecurity} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-brand/10 transition-colors text-left">
                      <Shield className="h-4 w-4 text-brand" />
                      Security
                    </button>
                  </div>
                  <div className="border-t border-dark-border py-1">
                    <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-brand/10 transition-colors text-left">
                      <LogOut className="h-4 w-4 text-brand" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {view === 'profile' && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
                    <button onClick={() => setView('menu')} className="text-xs text-white hover:text-brand transition-colors">← Back</button>
                    <span className="text-sm font-medium text-white">Profile</span>
                  </div>
                  <div className="px-4 py-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-white/60">Name</p>
                      <p className="text-white">{displayName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Email</p>
                      <p className="text-white">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Phone</p>
                      <p className="text-white">{user?.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {view === 'edit' && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
                    <button onClick={() => setView('menu')} className="text-xs text-white hover:text-brand transition-colors">← Back</button>
                    <span className="text-sm font-medium text-white">Edit Profile</span>
                  </div>
                  <div className="px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">First Name</label>
                        <input
                          value={editForm.firstName}
                          onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                          className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/60 mb-1">Last Name</label>
                        <input
                          value={editForm.lastName}
                          onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                          className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Email</label>
                      <input
                        value={editForm.email}
                        onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Phone</label>
                      <input
                        value={editForm.phone}
                        onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-dark-border border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <button onClick={saveEdit} className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
                      <Save className="h-4 w-4" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {view === 'security' && renderSecurity()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
