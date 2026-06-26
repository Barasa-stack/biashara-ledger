'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Database, Key, Calendar, CheckCircle2, XCircle, Clock, Copy, Check, Loader2 } from 'lucide-react';

export default function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setClient(data.error ? null : data);
    } catch { } finally { setLoading(false); }
  };

  const copyKey = async () => {
    if (!client?.license_key) return;
    try { await navigator.clipboard.writeText(client.license_key); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-3" /><p className="text-sm text-gray-500">Loading...</p></div>
    </div>
  );

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Building2 className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Client not found</p>
        <a href="/admin" className="text-brand text-sm font-medium hover:underline">&larr; Back to admin</a>
      </div>
    );
  }

  const fields = [
    { icon: Building2, label: 'Company Name', value: client.company_name },
    { icon: Mail, label: 'Email', value: client.email },
    { icon: Database, label: 'Database', value: client.database_name, mono: true },
    { icon: Key, label: 'License Key', value: client.license_key, mono: true, copyable: true },
    { icon: Calendar, label: 'Created', value: client.created_at ? new Date(client.created_at).toLocaleString() : '-' },
    { icon: Calendar, label: 'Trial Start', value: client.trial_start_date ? new Date(client.trial_start_date).toLocaleDateString() : '-' },
    { icon: Calendar, label: 'Trial End', value: client.trial_end_date ? new Date(client.trial_end_date).toLocaleDateString() : '-' },
    { icon: Calendar, label: 'Expires', value: client.expires_at ? new Date(client.expires_at).toLocaleDateString() : '-' },
    { icon: Clock, label: 'Last Active', value: client.last_active ? new Date(client.last_active).toLocaleString() : 'Never' },
    { icon: Building2, label: 'Max Users', value: String(client.max_users || '-') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </a>
            <h1 className="text-lg font-bold text-gray-900">Client Details</h1>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            {client.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-0 divide-y divide-gray-100">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <field.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">{field.label}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {field.copyable ? (
                    <>
                      <code className="text-sm font-mono bg-gray-50 px-2 py-1 rounded text-brand font-semibold flex-1 break-all">{field.value}</code>
                      <button onClick={copyKey} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                        {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                      </button>
                    </>
                  ) : (
                    <span className={`text-sm ${field.mono ? 'font-mono text-gray-500' : 'text-gray-900'}`}>{field.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">&larr; Back to all clients</a>
        </div>
      </main>
    </div>
  );
}
