'use client';

import { Loader2 } from 'lucide-react';
import { AuditEntry, formatTimeAgo } from '@/types/settings';

type Props = {
  entries: AuditEntry[];
  loading: boolean;
};

export default function AuditLog({ entries, loading }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  if (entries.length === 0) {
    return <div className="text-center py-12 text-sm text-gray-400">No audit log entries yet</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {['Action', 'Admin', 'IP Address', 'Timestamp'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{entry.action}{entry.entity_type ? ` (${entry.entity_type})` : ''}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{entry.admin_email || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{entry.ip_address || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{entry.created_at ? formatTimeAgo(entry.created_at) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
