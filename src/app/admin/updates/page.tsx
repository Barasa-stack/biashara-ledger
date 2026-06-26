'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

export default function AdminUpdatesPage() {
  const [version, setVersion] = useState('');
  const [changes, setChanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchLatestUpdate(); }, []);

  const fetchLatestUpdate = async () => {
    try {
      const res = await fetch('/api/admin/update');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setLatestUpdate(data);
    } catch {}
  };

  const handlePushUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !changes) {
      setMessage('Version number and change log are required');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          changes: changes.split('\n').filter(Boolean),
          releaseDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Update v${version} published successfully!`);
        setMessageType('success');
        setVersion('');
        setChanges('');
        fetchLatestUpdate();
      } else {
        setMessage('Error: ' + (data.error || 'Failed to publish'));
        setMessageType('error');
      }
    } catch (err: any) {
      setMessage('Error: ' + err.message);
      setMessageType('error');
    } finally { setLoading(false); }
  };

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
            <a href="/admin/electron-users" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Electron</a>
            <a href="/admin/updates" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand/10 text-brand transition-colors">Updates</a>
            <a href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Back</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Push App Update</h2>
          <p className="text-sm text-gray-500 mt-1">Publish a new version to notify all Electron app users</p>
        </div>

        {latestUpdate?.version && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <ArrowUpCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Latest published: v{latestUpdate.version}</p>
              <p className="text-xs text-blue-600">{latestUpdate.release_date ? new Date(latestUpdate.release_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePushUpdate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Version Number</label>
            <input type="text" required placeholder="e.g. 1.0.1"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              value={version} onChange={e => setVersion(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Change Log <span className="text-gray-400 font-normal">(one per line)</span></label>
            <textarea required rows={6} placeholder="Fixed bug with invoice generation&#10;Added new export feature&#10;Improved performance"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none"
              value={changes} onChange={e => setChanges(e.target.value)} />
          </div>

          {message && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {messageType === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</> : <><Send className="h-4 w-4" /> Publish Update</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
