import type { Metadata } from 'next';
import AboutPage from './page-content';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about BiasharaLedger — built by entrepreneurs for entrepreneurs. We make business management software that understands your market.',
};

export default function Page() {
  return <AboutPage />;
}
