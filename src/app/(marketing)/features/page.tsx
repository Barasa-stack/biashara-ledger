import type { Metadata } from 'next';
import FeaturesPage from './page-content';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore BiasharaLedger\'s powerful features — real-time analytics, inventory management, sales, accounting, payroll, and mobile-first access.',
};

export default function Page() {
  return <FeaturesPage />;
}
