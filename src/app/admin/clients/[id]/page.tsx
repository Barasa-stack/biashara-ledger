'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Key,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Loader2,
  Globe,
  User,
  CreditCard,
  Activity,
  Shield,
  Clock as ClockIcon,
  Database,
  X,
} from 'lucide-react';

const PLAN_OPTIONS = ['Basic', 'Standard', 'Premium'];

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'licenses'>('overview');
  const [selectedPlan, setSelectedPlan] = useState('Basic');
  const [planUpdateError, setPlanUpdateError] = useState('');
  const [planUpdating, setPlanUpdating] = useState(false);
  const [resending, setResending] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/admin/clients/${params.id}`).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/licenses').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clientData, licensesData]) => {
        if (!clientData) {
          router.push('/admin/login');
          return;
        }

        setClient(clientData);
        if (Array.isArray(licensesData)) {
          setLicenses(licensesData.filter((l: any) => l.client_id === params.id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (!client) return;
    const planValue = client.plan || client.subscription_plan || 'Basic';
    setSelectedPlan(`${planValue.charAt(0).toUpperCase()}${planValue.slice(1)}`);
  }, [client]);

  const handlePlanUpdate = async () => {
    if (!params.id || !client) return;

    const currentPlan = client.plan || client.subscription_plan || 'Basic';
    if (selectedPlan === currentPlan) return;

    setPlanUpdating(true);
    setPlanUpdateError('');

    try {
      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPlanUpdateError(data.error || 'Failed to update plan');
      } else {
        setClient(data.client);
      }
    } catch (error) {
      setPlanUpdateError('Failed to update plan');
    } finally {
      setPlanUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Client not found</p>
        <button
          onClick={() => router.push('/admin/clients')}
          className="mt-4 text-sm text-brand hover:text-brand font-medium"
        >
          Back to clients
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'licenses', label: 'Licenses', icon: Shield },
  ];

  const currentPlan = client.plan || client.subscription_plan || 'Trial';

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{client.company_name}</h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  client.is_active ? 'bg-brand-light text-brand' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {client.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {client.is_active ? 'Active' : 'Inactive'}
              </span>
              {client.is_trial && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  <ClockIcon size={12} />
                  Trial
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" />
                {client.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Key size={14} className="text-gray-400" />
                <span className="font-mono text-xs">{client.license_key || 'No license'}</span>
                {client.license_key && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(client.license_key);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                Registered {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe size={14} className="text-gray-400" />
                {client.database_name || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive ? 'bg-brand-light text-brand' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Company', value: client.company_name, icon: Building2 },
                { label: 'Email', value: client.email, icon: Mail },
                { label: 'Database', value: client.database_name, icon: Database },
                { label: 'License Key', value: client.license_key || '—', icon: Key },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <Icon size={14} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm text-gray-700">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription & Plan</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Current Plan</p>
                  <p className="text-sm text-gray-700">{currentPlan}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Trial Start</p>
                  <p className="text-sm text-gray-700">{client.trial_start_date ? new Date(client.trial_start_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Trial End</p>
                  <p className="text-sm text-gray-700">{client.trial_end_date ? new Date(client.trial_end_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClockIcon size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Expires</p>
                  <p className="text-sm text-gray-700">{client.expires_at ? new Date(client.expires_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Max Users</p>
                  <p className="text-sm text-gray-700">{client.max_users || '—'}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-2">Change Plan</label>
                <div className="flex flex-col gap-3">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                  {planUpdateError ? <p className="text-xs text-red-500">{planUpdateError}</p> : null}
                  <button
                    type="button"
                    disabled={planUpdating || selectedPlan === currentPlan}
                    onClick={handlePlanUpdate}
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                  >
                    {planUpdating ? 'Saving...' : 'Save Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>
            <div className="space-y-3">
              {[
                { label: 'Status', value: client.is_active ? 'Active' : 'Inactive', icon: client.is_active ? CheckCircle2 : XCircle },
                { label: 'Registered', value: client.created_at ? new Date(client.created_at).toLocaleDateString() : '—', icon: Calendar },
                { label: 'Last Active', value: client.last_active ? new Date(client.last_active).toLocaleDateString() : 'Never', icon: ClockIcon },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <Icon size={14} className={client.is_active ? 'text-brand' : 'text-gray-400'} />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm text-gray-700">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

            {/* Actions */}
            {client.license_key && (
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                <button
                  onClick={async () => {
                    setResending(true);
                    try {
                      const res = await fetch('/api/admin/clients/resend-license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientId: params.id }),
                      });
                      const data = await res.json();
                      if (res.ok) alert('License email sent!');
                      else alert('Error: ' + data.error);
                    } catch { alert('Failed to send email'); }
                    setResending(false);
                  }}
                  disabled={resending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-brand text-brand px-4 py-2 text-sm font-medium hover:bg-brand/5 disabled:opacity-50 transition-colors"
                >
                  <Mail size={14} />
                  {resending ? 'Sending...' : 'Resend License Email'}
                </button>
              </div>
            )}
      </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {[
              { action: 'Client created', date: client.created_at, icon: User, color: 'text-brand' },
              { action: client.is_active ? 'Account active' : 'Account inactive', date: client.last_active, icon: Activity, color: client.is_active ? 'text-brand' : 'text-gray-400' },
              { action: client.is_trial ? 'Trial period' : 'Active subscription', date: client.trial_start_date, icon: CreditCard, color: 'text-blue-600' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className={`p-1.5 rounded-full bg-gray-100 ${item.color}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{item.action}</p>
                    <p className="text-xs text-gray-400">{item.date ? new Date(item.date).toLocaleString() : 'Unknown'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Assigned Licenses ({licenses.length})</h3>
          </div>
          {licenses.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No licenses assigned to this client</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Key</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {licenses.map((lic: any) => (
                    <tr key={lic.id || lic.license_key} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-700">{lic.license_key}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          lic.is_active ? 'text-brand bg-brand-light' : 'text-gray-400 bg-gray-100'
                        }`}>
                          {lic.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {lic.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{lic.plan || 'Standard'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
