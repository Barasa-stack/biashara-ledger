import type { Metadata } from 'next';
import HomePage from './page-content';

export const metadata: Metadata = {
  title: 'Business Management Software for Modern Enterprises',
  description: 'BiasharaLedger is the all-in-one platform for businesses worldwide — inventory management, sales, accounting, payroll, and reporting designed for your needs.',
};

export default function Page() {
  return <HomePage />;
}
