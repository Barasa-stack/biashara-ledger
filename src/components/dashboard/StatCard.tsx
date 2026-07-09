'use client';

import { TrendingUp, DollarSign } from 'lucide-react';

type Props = {
  icon: typeof TrendingUp | typeof DollarSign;
  label: string;
  value: string;
  color: string;
  change?: { value: number; positive: boolean } | null;
  onClick?: () => void;
};

export function StatCard({ icon: Icon, label, value, color, change, onClick }: Props) {
  const colorClass = color === 'red' ? 'text-red-600' : color === 'gray' ? 'text-gray-600' : 'text-brand';
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-border p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg ${color === 'red' ? 'bg-red-100' : 'bg-brand/10'} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-base font-bold ${colorClass} truncate`}>{value}</p>
        {change && (
          <p className={`text-xs mt-0.5 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
            {change.positive ? '▲' : '▼'} {Math.abs(change.value).toFixed(1)}% vs last period
          </p>
        )}
      </div>
    </div>
  );
}
