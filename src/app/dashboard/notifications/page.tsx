'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Mail, Smartphone, BellRing, Search } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  is_read: boolean;
  created_at: string;
};

type NotificationSettings = {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  invoice_events: boolean;
  payment_events: boolean;
  expense_events: boolean;
  customer_events: boolean;
  approval_events: boolean;
};

type NotificationsResponse = {
  notifications: Notification[];
  unread: number;
};

const defaultSettings: NotificationSettings = {
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  invoice_events: true,
  payment_events: true,
  expense_events: true,
  customer_events: false,
  approval_events: true,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchNotifications = () => {
    setLoading(true);
    setError('');
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load notifications'))
      .then((data: NotificationsResponse) => {
        setNotifications(data.notifications);
        setUnread(data.unread);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const toggleSetting = (field: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      fetchNotifications();
    } catch (e: any) {
      toast(e.message || 'Error updating notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      fetchNotifications();
    } catch (e: any) {
      toast(e.message || 'Error updating notifications');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (typeFilter && n.type !== typeFilter) return false;
    if (channelFilter && n.channel !== channelFilter) return false;
    if (statusFilter === 'read' && !n.is_read) return false;
    if (statusFilter === 'unread' && n.is_read) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const notificationTypes = [...new Set(notifications.map(n => n.type))];
  const channels = [...new Set(notifications.map(n => n.channel))];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load notifications</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchNotifications} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'No unread notifications'}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors">
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Email</span>
              </div>
              <button
                onClick={() => toggleSetting('email_enabled')}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.email_enabled ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.email_enabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">SMS</span>
              </div>
              <button
                onClick={() => toggleSetting('sms_enabled')}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.sms_enabled ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.sms_enabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">In-App</span>
              </div>
              <button
                onClick={() => toggleSetting('in_app_enabled')}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.in_app_enabled ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.in_app_enabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Event-Specific Toggles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={settings.invoice_events} onChange={() => toggleSetting('invoice_events')} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-gray-700">Invoice Events</span>
              </label>
              <label className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={settings.payment_events} onChange={() => toggleSetting('payment_events')} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-gray-700">Payment Events</span>
              </label>
              <label className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={settings.expense_events} onChange={() => toggleSetting('expense_events')} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-gray-700">Expense Events</span>
              </label>
              <label className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={settings.customer_events} onChange={() => toggleSetting('customer_events')} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-gray-700">Customer Events</span>
              </label>
              <label className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={settings.approval_events} onChange={() => toggleSetting('approval_events')} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-gray-700">Approval Events</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search notifications..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand w-full" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Types</option>
            {notificationTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Channels</option>
            {channels.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="">All Status</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
          {(typeFilter || channelFilter || statusFilter || searchQuery) && (
            <button onClick={() => { setTypeFilter(''); setChannelFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="text-xs text-brand font-medium hover:text-gray-800">Clear filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Notification Log</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm text-gray-600">Loading notifications...</span>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Bell className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Title</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Message</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Channel</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotifications.map(n => (
                  <tr key={n.id} className={`hover:bg-surface/50 transition-colors ${!n.is_read ? 'bg-brand/5' : ''}`}>
                    <td className="py-3 pr-4">
                      <span className="inline-block text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                        {n.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{n.title}</td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[250px] truncate">{n.message}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {n.channel === 'email' && <Mail className="h-3.5 w-3.5 text-gray-400" />}
                        {n.channel === 'sms' && <Smartphone className="h-3.5 w-3.5 text-gray-400" />}
                        {n.channel === 'in_app' && <BellRing className="h-3.5 w-3.5 text-gray-400" />}
                        <span className="text-xs text-gray-600 capitalize">{n.channel.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${n.is_read ? 'bg-gray-100 text-gray-500' : 'bg-brand/10 text-brand'}`}>
                        {n.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 text-xs">{new Date(n.created_at).toLocaleDateString('en-US')}</td>
                    <td className="py-3 text-right">
                      {!n.is_read && (
                        <button onClick={() => handleMarkRead(n.id)} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover transition-colors">
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
