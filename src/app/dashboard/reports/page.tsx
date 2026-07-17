'use client';

import { Suspense } from 'react';
import { ReportsContent } from '@/components/reports/ReportsContent';

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-sm text-[#000000]">Loading reports...</span>
        </div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
