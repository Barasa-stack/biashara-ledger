'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, CheckCircle2, XCircle, Search, Loader2, AlertTriangle } from 'lucide-react';

export default function AdminElectronUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/electron-users');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const revokeLicense = async (licenseKey: string) => {
    try {
      const res = await fetch('/api/admin/revoke-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      if (res.ok) {
        setConfirmRevoke(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Revoke failed'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filtered = users.filter(u =>
    !search || u.license_key?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-3" /><p className="text-sm text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><span className="text-white text-xs font-bold">BL</span></div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-1">
            <a href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Clients</a>
            <a href="/admin/licenses" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Licenses</a>
            <a href="/admin/offline-clients" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Offline</a>
            <a href="/admin/electron-users" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand/10 text-brand transition-colors">Electron</a>
            <a href="/admin/updates" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Updates</a>
            <a href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Back</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Electron User Management</h2>
            <p className="text-sm text-gray-500 mt-1">{users.length} registered user(s)</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none w-64"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">License Key</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Activity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Last Active</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Expires</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user: any) => (
                  <tr key={user.license_key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5"><code className="text-xs bg-gray-50 px-2 py-1 rounded font-mono text-gray-600">{user.license_key}</code></td>
                    <td className="px-4 py-3.5 text-gray-900">{user.email}</td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{user.company_name || '-'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{user.activity_count}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{user.expires_at ? new Date(user.expires_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => setConfirmRevoke(user.license_key)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <Monitor className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No Electron users registered yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {confirmRevoke && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmRevoke(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Revoke License</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will disable the user&apos;s access immediately. They will need a new license key to continue using the application.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRevoke(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => revokeLicense(confirmRevoke)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md">Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
