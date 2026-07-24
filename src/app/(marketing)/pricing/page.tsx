import type { Metadata } from 'next';
import { Suspense } from 'react';
import PricingPage from './page-content';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for businesses of all sizes. Start with a 14-day free trial — no credit card required.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading pricing...</div>}>
      <PricingPage />
    </Suspense>
  );
}
