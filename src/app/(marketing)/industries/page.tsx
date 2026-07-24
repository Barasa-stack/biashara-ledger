import type { Metadata } from 'next';
import IndustriesPage from './page-content';

export const metadata: Metadata = {
  title: 'Industries',
  description: 'BiasharaLedger adapts to your industry — retail, manufacturing, healthcare, education, hospitality, and e-commerce solutions.',
};

export default function Page() {
  return <IndustriesPage />;
}
