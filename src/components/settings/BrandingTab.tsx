'use client';

import { BrandingSettings } from '@/types/settings';

type Props = {
  branding: BrandingSettings;
  onChange: (branding: BrandingSettings) => void;
};

export default function BrandingTab({ branding, onChange }: Props) {
  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={branding.primary_color}
            onChange={e => onChange({ ...branding, primary_color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
          <span className="text-sm text-gray-500">{branding.primary_color}</span>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Logo URL</label>
        <input type="text" value={branding.logo_url}
          onChange={e => onChange({ ...branding, logo_url: e.target.value })}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Favicon URL</label>
        <input type="text" value={branding.favicon_url}
          onChange={e => onChange({ ...branding, favicon_url: e.target.value })}
          placeholder="https://example.com/favicon.ico"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
    </div>
  );
}
