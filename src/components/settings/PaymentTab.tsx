'use client';

import { Loader2 } from 'lucide-react';
import { PaymentSettings } from '@/types/settings';

type Props = {
  payment: PaymentSettings;
  onChange: (payment: PaymentSettings) => void;
  loading: boolean;
};

export default function PaymentTab({ payment, onChange, loading }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Provider</label>
        <select value={payment.provider}
          onChange={e => onChange({ ...payment, provider: e.target.value })}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="M-Pesa (Daraja API)">M-Pesa (Daraja API)</option>
          <option value="Stripe">Stripe</option>
          <option value="PayPal">PayPal</option>
          <option value="Flutterwave">Flutterwave</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
        <input type="password" value={payment.api_key}
          onChange={e => onChange({ ...payment, api_key: e.target.value })}
          placeholder="Enter API key"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Webhook Secret</label>
        <input type="password" value={payment.webhook_secret}
          onChange={e => onChange({ ...payment, webhook_secret: e.target.value })}
          placeholder="Enter webhook secret"
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
    </div>
  );
}
