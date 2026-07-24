import type { Metadata } from 'next';
import BlogPage from './page-content';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest articles, guides, and insights from the BiasharaLedger team on business management, accounting, and growth.',
};

export default function Page() {
  return <BlogPage />;
}
