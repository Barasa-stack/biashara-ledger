'use client';


import Link from 'next/link';
import { useState, useEffect } from 'react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const desktopImages: CityImage[] = [
  { url: '/images/backgrounds/desktop/bg.jpg', label: 'Sleek Tech · Modern Workspace' },
];

const requirements = [
  'Windows 10 or Windows 11 (64-bit)',
  '4GB RAM minimum (8GB recommended)',
  '500MB free disk space',
  'Internet connection for initial activation only',
];

const features = [
  'Work without internet — full offline capability',
  'Local data storage with automatic backups',
  'Sync data when connected to the cloud',
  'One-time license — no recurring subscription (Premium)',
  'Faster performance with native desktop experience',
];

const macFeatures = [
  'Full offline capability',
  'Works on Intel & Apple Silicon',
  'Optimized for macOS Sequoia',
  'One-time license',
  'Cloud sync ready',
];

export default function DownloadPage() {
  const [showDialog, setShowDialog] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/downloads/latest')
      .then(r => r.json())
      .then(setDownloadInfo)
      .catch(() => {});
  }, []);

  const startDownload = async (platform: string) => {
    setShowDialog(platform);
    setDownloading(platform);
    setError(null);

    const info = downloadInfo?.[platform];
    const localType = platform === 'windows' ? 'windows' : platform === 'mac' ? 'mac' : platform === 'mac-arm64' ? 'mac-arm64' : 'linux';

    if (info?.url && info.url.startsWith('http')) {
      // GitHub release URL — redirect directly
      window.open(info.url, '_blank');
      setDownloading(null);
      setTimeout(() => { setShowDialog(null); setError(null); }, 2000);
      return;
    }

    // Local fallback — fetch through our API
    try {
      const resp = await fetch(`/api/download?type=${localType}`);
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errData.error || 'Download failed');
      }
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = info?.name || `BiasharaLedger-${platform === 'windows' ? 'Setup.exe' : 'macOS.dmg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e: any) {
      setError(e.message || 'Download failed');
    }
    setTimeout(() => { setShowDialog(null); setDownloading(null); setError(null); }, 4000);
  };

  const version = downloadInfo?.version || '1.0.0';

  return (
    <div className="min-h-screen">
      <style jsx>{`
        .gradient-text-shine {
          background: linear-gradient(90deg, #df1c1c, #ff6b6b, #feca57, #df1c1c);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shine 4s ease-in-out infinite;
        }
        @keyframes gradient-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .floating-text {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
      <PageHero
        images={desktopImages}
        showTrustBanner={false}
        title={
          <div className="floating-text">
            Download
            <br />
            <span className="gradient-text-shine">BiasharaLedger</span>
          </div>
        }
        subtitle="Choose how you want to use BiasharaLedger — online from any browser, or as a native desktop application."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-white mb-2">Online SaaS</h3>
            <p className="text-sm text-white/60 mb-4">Access from any browser, anywhere. Always up to date.</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-white/60">Access from any browser</li>
              <li className="flex items-start gap-2 text-sm text-white/60">Always updated automatically</li>
              <li className="flex items-start gap-2 text-sm text-white/60">Multi-device access</li>
              <li className="flex items-start gap-2 text-sm text-white/60">Cloud sync &amp; backup</li>
            </ul>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Get Started Online
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border-2 border-brand/30 rounded-xl p-8 hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-3 left-6 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
            <h3 className="text-lg font-semibold text-white mb-2">Windows Desktop</h3>
            <p className="text-sm text-white/60 mb-4">Native offline application with full accounting features.</p>
            <p className="text-xs text-brand/70 mb-2">Latest version: v{version}</p>
            <ul className="space-y-2 mb-6">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60">{f}</li>
              ))}
            </ul>
            <button
              onClick={() => startDownload('windows')}
              className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-hover text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Download for Windows
            </button>
            <p className="text-xs text-white/40 text-center mt-2">Windows 10/11 (64-bit)</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-white mb-2">macOS Desktop</h3>
            <p className="text-sm text-white/60 mb-4">Native Mac application. Built for Apple Silicon & Intel.</p>
            <p className="text-xs text-brand/70 mb-2">Latest version: v{version}</p>
            <ul className="space-y-2 mb-6">
              {macFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60">{f}</li>
              ))}
            </ul>
            <button
              onClick={() => startDownload('mac')}
              className="inline-flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm border border-white/20"
            >
              Download for macOS
            </button>
            <p className="text-xs text-white/40 text-center mt-2">Intel & Apple Silicon</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 sm:p-10 mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">System Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((r, i) => (
              <span key={i} className="text-sm text-white/70">{r}</span>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 grid sm:grid-cols-2 gap-4 text-sm text-white/60">
            <div><span className="font-medium text-white">Version:</span> v{version}</div>
            <div><span className="font-medium text-white">File Size:</span> ~150MB (compressed)</div>
            <div><span className="font-medium text-white">Release Date:</span> {downloadInfo?.publishedAt ? new Date(downloadInfo.publishedAt).toLocaleDateString() : 'June 2026'}</div>
            <div><span className="font-medium text-white">License:</span> 3-day free trial included</div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-3">Need help?</h2>
          <p className="text-sm text-white/60 mb-4">
            Visit our <Link href="/contact" className="text-brand font-medium hover:underline">Contact page</Link> or check the installation guide.
          </p>
          <p className="text-xs text-white/40">
            Latest version: <span className="text-white/50">v{version}</span>
          </p>
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {showDialog === 'windows' ? 'Downloading Windows Desktop' :
               showDialog === 'mac' ? 'Downloading macOS Desktop' :
               showDialog === 'mac-arm64' ? 'Downloading macOS (Apple Silicon)' :
               'Downloading Linux Desktop'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">
                  {downloading ? 'Processing...' : 'Complete'} &mdash;
                  {downloadInfo?.[showDialog]?.url?.startsWith('http')
                    ? 'Redirecting to download server...'
                    : 'Preparing download...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">
                  {downloading ? 'Processing...' : 'Complete'} &mdash;
                  {downloadInfo?.source === 'github' ? 'Downloading from GitHub Releases' : 'Downloading from server'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">Download starting...</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-brand rounded-full h-2 transition-all duration-1000" style={{width: downloading ? '60%' : '100%'}} />
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              {!error && <p className="text-xs text-white\/50 text-center">
                {downloading ? 'Please wait...' : 'Download started!'}
              </p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
