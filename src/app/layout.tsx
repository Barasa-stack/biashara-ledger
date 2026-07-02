import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ensureDbInitialized } from '@/lib/init';

const baseUrl = 'https://biasharaledsgr.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'BiasharaLedger - Business Management Software for Kenyan SMEs',
    template: '%s | BiasharaLedger',
  },
  description: 'Cloud and desktop business management platform for Kenyan retailers, wholesalers, pharmacies, and SMEs. Inventory, POS, accounting, payroll, and KRA compliance in one place.',
  keywords: ['business management software', 'accounting software Kenya', 'inventory management', 'POS system', 'KRA compliance', 'payroll software', 'MPesa reconciliation', 'Kenyan SME software', 'BiasharaLedger'],
  authors: [{ name: 'BiasharaLedger' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'BiasharaLedger',
    title: 'BiasharaLedger - Business Management Software for Kenyan SMEs',
    description: 'Cloud and desktop platform for inventory, POS, accounting, payroll, and KRA compliance. Built for Kenyan businesses.',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BiasharaLedger - Business Management Software',
    description: 'Cloud and desktop platform for inventory, POS, accounting, payroll, and KRA compliance.',
  },
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
  alternates: { canonical: baseUrl },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDbInitialized();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BiasharaLedger',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Cloud and desktop business management platform for Kenyan SMEs.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-715-434-805',
      contactType: 'sales',
      availableLanguage: ['English', 'Swahili'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
    },
    sameAs: [
      'https://wa.me/254715434805',
    ],
  };

  return (
    <html lang="en-KE">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#ffffff] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
