import type { Metadata } from 'next';
import ContactPage from './page-content';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the BiasharaLedger team. Email, phone, or live chat — we\'re here to help.',
};

export default function Page() {
  return <ContactPage />;
}
