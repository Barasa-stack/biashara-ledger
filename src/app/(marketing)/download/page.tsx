import type { Metadata } from 'next';
import DownloadPage from './page-content';

export const metadata: Metadata = {
  title: 'Download',
  description: 'Download the BiasharaLedger desktop app for macOS, Windows, or Linux. Faster performance, offline mode, and automatic sync.',
};

export default function Page() {
  return <DownloadPage />;
}
