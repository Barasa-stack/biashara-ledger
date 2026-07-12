'use client';

export function PayablesCard({ data, fmt }: { data?: { total: number; open: number; overdue: number }; fmt: (n: number) => string }) {
  const d = data || { total: 0, open: 0, overdue: 0 };
  const openPct = d.total > 0 ? (d.open / d.total) * 100 : 0;
  const overduePct = d.total > 0 ? (d.overdue / d.total) * 100 : 0;
  const hasOverdue = d.overdue > 0;
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Payables</h3>
        <span className={`text-xs font-medium ${hasOverdue ? 'text-red-600' : 'text-gray-400'}`}>
          {hasOverdue ? '⚠ Overdue Due' : '✓ No Overdue'}
        </span>
      </div>
      <p className={`text-2xl font-bold mb-3 ${hasOverdue ? 'text-red-600' : 'text-gray-800'}`}>{fmt(d.total)}</p>
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Open <span className="font-medium text-gray-800">{fmt(d.open)}</span></span>
          <span className="text-gray-500">Overdue <span className="font-medium text-red-600">{fmt(d.overdue)}</span></span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="bg-gray-400 h-full transition-all" style={{ width: `${openPct}%` }} />
          <div className="bg-red-500 h-full transition-all" style={{ width: `${overduePct}%` }} />
        </div>
      </div>
      <a href="/dashboard/reports?type=payables-aging" className="text-xs text-brand font-medium hover:text-gray-800 transition-colors">View Report &rarr;</a>
    </div>
  );
}
