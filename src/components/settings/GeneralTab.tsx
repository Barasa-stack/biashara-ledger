'use client';

import { Loader2 } from 'lucide-react';
import { GeneralSettings } from '@/types/settings';

type Props = {
  general: GeneralSettings;
  onChange: (general: GeneralSettings) => void;
  loading: boolean;
};

export default function GeneralTab({ general, onChange, loading }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Platform Name</label>
        <input type="text" value={general.platform_name}
          onChange={e => onChange({ ...general, platform_name: e.target.value })}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Support Email</label>
        <input type="email" value={general.support_email}
          onChange={e => onChange({ ...general, support_email: e.target.value })}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Currency</label>
        <div className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
          KES - Kenyan Shilling
        </div>
        <p className="text-xs text-gray-400 mt-1">Only KES is supported</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Time Zone</label>
        <select value={general.timezone}
          onChange={e => onChange({ ...general, timezone: e.target.value })}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="Africa/Nairobi (UTC+3)">Africa/Nairobi (UTC+3)</option>
          <option value="Africa/Dar_es_Salaam (UTC+3)">Africa/Dar_es_Salaam (UTC+3)</option>
          <option value="Africa/Kampala (UTC+3)">Africa/Kampala (UTC+3)</option>
        </select>
      </div>
    </div>
  );
}
