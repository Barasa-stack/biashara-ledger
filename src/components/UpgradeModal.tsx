'use client';

import Link from 'next/link';
import { X, Lock, ArrowRight, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  featureName: string;
  currentPlan: string;
  requiredPlan: string;
  onClose: () => void;
}

export default function UpgradeModal({ featureName, currentPlan, requiredPlan, onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Upgrade to Unlock</h2>
          <p className="text-sm text-gray-500 mt-2">
            <span className="font-semibold text-gray-700">{featureName}</span> is available on the{' '}
            <span className="font-semibold text-brand">{requiredPlan}</span> plan and above.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current plan</span>
            <span className="font-semibold text-gray-900 capitalize">{currentPlan}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Required plan</span>
            <span className="font-semibold text-brand">{requiredPlan}</span>
          </div>
        </div>

        <Link
          href="/pricing"
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand/25"
        >
          <Sparkles size={16} />
          View Upgrade Options
          <ArrowRight size={16} />
        </Link>

        <p className="text-xs text-gray-400 text-center mt-4">
          Upgrade to unlock all features included in your new plan.
        </p>
      </div>
    </div>
  );
}
