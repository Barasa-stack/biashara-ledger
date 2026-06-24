import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ensureDbInitialized } from '@/lib/init';

export const metadata: Metadata = {
  title: 'BiasharaLedger - KES Accounting Software',
  description: 'Small-scale accounting software for Kenyan businesses',
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDbInitialized();

  return (
    <html lang="en">
      <body className="bg-[#ffffff] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
