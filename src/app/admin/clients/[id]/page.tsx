'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Building2, Mail, Phone, Key, Calendar, CheckCircle2, XCircle, Clock,
  Copy, Check, Loader2, Globe, User, CreditCard, Activity, FileText, Shield,
  Monitor, Clock as ClockIcon, ExternalLink, AlertTriangle, Database
} from 'lucide-react';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'licenses'>('overview');

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/admin/clients/${params.id}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setClient(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, router]);

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
        <button onClick={() => router.push('/admin/clients')} className="mt-4 text-sm text-brand hover:text-brand font-medium">Back to clients</button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'licenses', label: 'Licenses', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/admin/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{client.company_name}</h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                client.is_active ? 'bg-brand-light text-brand' : 'bg-gray-100 text-gray-500'
              }`}>
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
                  <button onClick={() => { navigator.clipboard.writeText(client.license_key); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="text-gray-400 hover:text-gray-600">
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

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
        {tabs.map(tab => {
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

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Company', value: client.company_name, icon: Building2 },
                { label: 'Email', value: client.email, icon: Mail },
                { label: 'Database', value: client.database_name, icon: Database },
                { label: 'License Key', value: client.license_key || '—', icon: Key },
              ].map(item => {
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

          {/* Subscription info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription & Plan</h3>
            <div className="space-y-3">
              {[
                { label: 'Plan', value: client.is_trial ? 'Trial' : 'Active', icon: CreditCard },
                { label: 'Trial Start', value: client.trial_start_date ? new Date(client.trial_start_date).toLocaleDateString() : '—', icon: Calendar },
                { label: 'Trial End', value: client.trial_end_date ? new Date(client.trial_end_date).toLocaleDateString() : '—', icon: Calendar },
                { label: 'Expires', value: client.expires_at ? new Date(client.expires_at).toLocaleDateString() : '—', icon: ClockIcon },
                { label: 'Max Users', value: client.max_users || '—', icon: User },
              ].map(item => {
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

          {/* Account info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>
            <div className="space-y-3">
              {[
                { label: 'Status', value: client.is_active ? 'Active' : 'Inactive', icon: client.is_active ? CheckCircle2 : XCircle },
                { label: 'Registered', value: client.created_at ? new Date(client.created_at).toLocaleDateString() : '—', icon: Calendar },
                { label: 'Last Active', value: client.last_active ? new Date(client.last_active).toLocaleDateString() : 'Never', icon: ClockIcon },
              ].map(item => {
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
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-400 text-center py-8">Activity log coming soon</p>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-400 text-center py-8">Licenses assigned to this client will appear here</p>
        </div>
      )}
    </div>
  );
}
