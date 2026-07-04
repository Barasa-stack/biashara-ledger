import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ensureDbInitialized } from '@/lib/init';

const baseUrl = 'https://biasharaledsgr.com';

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
  await ensureDbInitialized();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BiasharaLedger',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Cloud and desktop business management platform for businesses worldwide.',
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
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#ffffff] antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
