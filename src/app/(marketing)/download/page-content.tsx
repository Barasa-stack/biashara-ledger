'use client';

import { Download, Monitor, Smartphone, Laptop, ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';

const DOWNLOADS = [
  {
    platform: 'macOS',
    icon: Monitor,
    desc: 'Native macOS application for Intel and Apple Silicon.',
    version: '1.0.0',
    size: '85 MB',
    href: '#',
    comingSoon: false,
  },
  {
    platform: 'Windows',
    icon: Laptop,
    desc: 'Windows application for 64-bit systems.',
    version: '1.0.0',
    size: '92 MB',
    href: '#',
    comingSoon: false,
  },
  {
    platform: 'Linux',
    icon: Monitor,
    desc: 'AppImage for most Linux distributions.',
    version: '1.0.0',
    size: '88 MB',
    href: '#',
    comingSoon: false,
  },
  {
    platform: 'Android',
    icon: Smartphone,
    desc: 'Android app coming soon.',
    version: null,
    size: null,
    href: '#',
    comingSoon: true,
  },
  {
    platform: 'iOS',
    icon: Smartphone,
    desc: 'iOS app coming soon.',
    version: null,
    size: null,
    href: '#',
    comingSoon: true,
  },
];

const FEATURES = [
  'Offline mode — work without internet',
  'Automatic sync when online',
  'Desktop notifications',
  'Keyboard shortcuts',
  'Multi-window support',
  'Local file backups',
];

export default function DownloadPage() {
  return (
    <div>
      <section className="py-20 bg-gradient-to-b from-brand/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4"><span className="text-xs font-semibold text-brand">Download</span></div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Download BiasharaLedger</h1>
            <p className="text-lg text-gray-600">Get the desktop app for a faster, more powerful experience. Available on all major platforms.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
            {DOWNLOADS.filter(d => !d.comingSoon).map((dl) => {
              const Icon = dl.icon;
              return (
                <a key={dl.platform} href={dl.href} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-all hover:border-brand/30 group">
                  <Icon className="h-10 w-10 text-brand mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{dl.platform}</h3>
                  <p className="text-xs text-gray-500 mb-3">{dl.desc}</p>
                  <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mb-4">
                    {dl.version && <span>v{dl.version}</span>}
                    {dl.size && <span>{dl.size}</span>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold group-hover:bg-brand-hover transition-colors">
                    <Download className="h-4 w-4" />
                    Download
                  </span>
                </a>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            {DOWNLOADS.filter(d => d.comingSoon).map((dl) => {
              const Icon = dl.icon;
              return (
                <div key={dl.platform} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center opacity-60">
                  <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-gray-500">{dl.platform}</h3>
                  <p className="text-xs text-gray-400">Coming Soon</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Why Use the Desktop App?</h2>
              <p className="text-gray-600">The desktop app gives you additional capabilities beyond the web version.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <div key={f} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-gray-700">{f}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 mb-2">Also available on the web</p>
              <Link href="/app" className="text-sm font-semibold text-brand hover:underline inline-flex items-center gap-1">Open Web App <ExternalLink className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Open Source</h2>
          <p className="text-lg text-gray-500 mb-8">BiasharaLedger is open source. Contribute on GitHub.</p>
          <Link href="https://github.com/Barasa-stack/biashara-ledger" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all">
            <Github className="h-5 w-5" />
            View on GitHub
          </Link>
        </div>
      </section>
    </div>
  );
}
