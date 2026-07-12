'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DealsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/crm/pipeline'); }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-sm text-gray-600">Redirecting to CRM Pipeline...</span>
      </div>
    </div>
  );
}
