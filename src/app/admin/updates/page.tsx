'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, CheckCircle2, Loader2, Send, ArrowUpCircle, Clock,
  AlertTriangle, Download, History, Tag, FileText, Globe
} from 'lucide-react';

export default function UpdatesPage() {
  const router = useRouter();
  const [latest, setLatest] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');
  const [changes, setChanges] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch('/api/admin/update')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setLatest(data);
          setVersionHistory(data.history || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const publishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !changes) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, changes, isMandatory }),
      });
      if (res.ok) {
        const data = await res.json();
        setLatest(data.update || data);
        setVersion('');
        setChanges('');
        setIsMandatory(false);
      }
    } catch (err) { console.error(err); }
    setPublishing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current version info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Version</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Stable', value: latest?.version || '—', icon: CheckCircle2, color: 'text-brand' },
              { label: 'Released', value: latest?.release_date ? new Date(latest.release_date).toLocaleDateString() : '—', icon: Clock, color: 'text-blue-600' },
              { label: "Downloads", value: latest?.downloads || 0, icon: Download, color: 'text-violet-600' },
              { label: "Status", value: latest?.status || 'Live', icon: Globe, color: 'text-brand' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Icon size={20} className={`mx-auto mb-2 ${s.color}`} />
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
          {latest?.changes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Release Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{latest.changes}</p>
            </div>
          )}
        </div>

        {/* Version History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {versionHistory.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No version history yet</div>
            ) : (
              versionHistory.map((v: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Tag size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">v{v.version}</span>
                      <span className="text-xs text-gray-400">{v.release_date ? new Date(v.release_date).toLocaleDateString() : ''}</span>
                      {v.is_mandatory && <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Mandatory</span>}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{v.changes || 'No release notes'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.status === 'live' ? 'bg-brand-light text-brand' : 'bg-gray-100 text-gray-500'}`}>
                    {v.status || 'archived'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Publish new version */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-fit lg:sticky lg:top-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center">
            <Upload size={18} className="text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Publish Update</h3>
            <p className="text-xs text-gray-500">Push a new version to all clients</p>
          </div>
        </div>

        <form onSubmit={publishUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Version Number</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="e.g. 2.5.0"
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Release Notes</label>
            <textarea
              value={changes}
              onChange={e => setChanges(e.target.value)}
              placeholder="What's new in this version..."
              rows={5}
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={e => setIsMandatory(e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <span className="text-sm text-gray-600">Mandatory update</span>
          </label>
          <button
            type="submit"
            disabled={!version || !changes || publishing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {publishing ? 'Publishing...' : 'Publish Update'}
          </button>
        </form>
      </div>
    </div>
  );
}
