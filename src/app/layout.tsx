import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import ChatWidget from '@/components/ChatWidget';

const baseUrl = 'https://biasharaledger.qzz.io';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'BiasharaLedger - Business Management Software for Modern Enterprises',
    template: '%s | BiasharaLedger',
  },
  description: 'Cloud and desktop business management platform for inventory, POS, accounting, payroll, and compliance. Built for businesses worldwide.',
  keywords: ['business management software', 'accounting software', 'inventory management', 'POS system', 'payroll software', 'compliance', 'global business software', 'BiasharaLedger'],
  authors: [{ name: 'BiasharaLedger' }],
  robots: { index: true, follow: true },
  verification: { google: 'VCdOLPOo04llA0b6y-hNo3TQFbgpHoVSUG6Zw5pVxyo' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BiasharaLedger',
    title: 'BiasharaLedger - Business Management Software',
    description: 'Cloud and desktop platform for inventory, POS, accounting, payroll, and compliance. Built for businesses worldwide.',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BiasharaLedger - Business Management Software',
    description: 'Cloud and desktop platform for inventory, POS, accounting, payroll, and compliance.',
  },
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
  alternates: { canonical: baseUrl },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BiasharaLedger',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Cloud and desktop business management platform for businesses worldwide.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#ffffff] antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
