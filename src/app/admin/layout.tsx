'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Building2, Key, Monitor, Upload, Settings,
  LogOut, Bell, Search, ChevronDown, Menu, X, ExternalLink,
  Activity, Shield, RefreshCw, UserCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
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

function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }),
      });
      fetchNotifications();
    } catch {}
  };

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
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) { fetch('/api/auth/signout', { method: 'POST' }).finally(() => { window.location.href = '/admin/login'; }); }
    }, 15000);

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => {
        if (cancelled) return null;
        if (r.status === 401 || r.status === 403) throw new Error('Unauthorized');
        return r.json();
      })
      .then(data => {
        if (cancelled || !data) return;
        if (data?.user?.role === 'super_admin') {
          setAuthorized(true);
          clearTimeout(timeoutId);
          setChecking(false);
        } else {
          throw new Error('Not super_admin');
        }
      })
      .catch(() => {
        if (!cancelled) fetch('/api/auth/signout', { method: 'POST' }).finally(() => { window.location.href = '/admin/login'; });
      });

    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [pathname]);

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      const sanitized = q.replace(/[<>"']/g, '');
      router.push(`/admin/clients?search=${encodeURIComponent(sanitized)}`);
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
                          onClick={() => { setShowQuickActions(false); router.push(`/admin?action=${action.action}`); }}
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      <button onClick={markAllRead} className="text-xs text-brand font-medium hover:text-brand-hover">Mark all read</button>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            onClick={() => { setShowNotifications(false); if (n.link) router.push(n.link); }}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-brand-light/30' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-700 truncate">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {n.created_at ? formatTimeAgo(n.created_at) : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
                  await fetch('/api/auth/signout', { method: 'POST' });
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
