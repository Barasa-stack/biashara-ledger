'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Key, Monitor, Upload, Settings,
  LogOut, Bell, Search, ChevronDown, Menu, X, ExternalLink,
  Activity, Shield, FileText, RefreshCw, UserCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/licenses', label: 'Licenses', icon: Key },
  { href: '/admin/offline', label: 'Offline', icon: Monitor },
  { href: '/admin/electron-users', label: 'Electron', icon: Monitor },
  { href: '/admin/users', label: 'Users', icon: UserCircle },
  { href: '/admin/updates', label: 'Updates', icon: Upload },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const QUICK_ACTIONS_DROPDOWN = [
  { label: 'Generate License', icon: Key, action: 'generate-license' },
  { label: 'Add Client', icon: Users, action: 'add-client' },
  { label: 'Upload Update', icon: Upload, action: 'upload-update' },
  { label: 'Transfer License', icon: RefreshCw, action: 'transfer-license' },
  { label: 'Revoke License', icon: Shield, action: 'revoke-license' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, text: 'New client registered: Acme Corp', time: '2m ago', type: 'info', link: '/admin/clients' },
    { id: 2, text: 'License BL-2026-A1B2 expiring in 3 days', time: '15m ago', type: 'warning', link: '/admin/licenses' },
    { id: 3, text: 'Payment received: KES 3,000 from John Doe', time: '1h ago', type: 'success', link: '/admin/licenses' },
  ]);

  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setShowQuickActions(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    fetch('/api/auth/me')
      .then(r => {
        if (r.status === 401 || r.status === 403) throw new Error('Unauthorized');
        return r.json();
      })
      .then(data => {
        if (data?.user?.role === 'super_admin') {
          setAuthorized(true);
        } else {
          throw new Error('Not super_admin');
        }
      })
      .catch(() => {
        router.push('/admin/login');
      })
      .finally(() => setChecking(false));
  }, [pathname, router]);

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/clients?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const currentPage = NAV_ITEMS.find(i => pathname === i.href)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-dark border-r border-dark-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Biashara</span>
            <span className="text-sm font-bold text-brand">Ledger</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-white/70 hover:bg-dark-hover hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand' : 'text-white/40'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-dark-border shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <ExternalLink size={16} />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top nav */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Left: Mobile toggle + Page title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients, licenses, machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-colors"
                />
              </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Search (mobile) */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Search size={18} />
              </button>

              {/* Quick actions */}
              <div className="relative" ref={quickRef}>
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors"
                >
                  <Activity size={16} />
                  <span className="hidden sm:inline">Quick Actions</span>
                  <ChevronDown size={14} className={`transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
                </button>
                {showQuickActions && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {QUICK_ACTIONS_DROPDOWN.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.action}
                          onClick={() => { setShowQuickActions(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon size={16} className="text-gray-400" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      <button className="text-xs text-brand font-medium hover:text-brand-hover">Mark all read</button>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { setShowNotifications(false); router.push(n.link); }}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <p className="text-sm text-gray-700">{n.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 text-center">
                      <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">View all</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <button
                onClick={() => router.push('/admin/settings')}
                className="flex items-center gap-2 pl-2 pr-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-brand">A</span>
                </div>
                <span className="hidden sm:inline text-sm font-medium">Admin</span>
              </button>

              {/* Logout */}
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/admin/login');
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {showSearch && (
            <div className="md:hidden px-4 pb-4">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                />
              </form>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
