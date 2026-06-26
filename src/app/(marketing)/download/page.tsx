'use client';

import { Download, Monitor, Globe, CheckCircle, ChevronRight, Loader2, Apple } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-brand" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Download BiasharaLedger
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose how you want to use BiasharaLedger — online from any browser, or as a native desktop application.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Online SaaS</h3>
            <p className="text-sm text-gray-600 mb-4">Access from any browser, anywhere. Always up to date.</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Access from any browser</li>
              <li className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Always updated automatically</li>
              <li className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Multi-device access</li>
              <li className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Cloud sync &amp; backup</li>
            </ul>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Get Started Online <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-2 border-brand/20 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-gradient-to-b from-brand/[0.02] to-white relative">
            <div className="absolute -top-3 left-6 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
              <Monitor className="h-6 w-6 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Windows Desktop</h3>
            <p className="text-sm text-gray-600 mb-4">Native offline application with full accounting features.</p>
            <p className="text-xs text-brand/70 mb-2">Latest version: v{version}</p>
            <ul className="space-y-2 mb-6">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> {f}</li>
              ))}
            </ul>
            <button
              onClick={() => startDownload('windows')}
              className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-hover text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" /> Download for Windows
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Windows 10/11 (64-bit)</p>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Apple className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">macOS Desktop</h3>
            <p className="text-sm text-gray-600 mb-4">Native Mac application. Built for Apple Silicon & Intel.</p>
            <p className="text-xs text-brand/70 mb-2">Latest version: v{version}</p>
            <ul className="space-y-2 mb-6">
              {macFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> {f}</li>
              ))}
            </ul>
            <button
              onClick={() => startDownload('mac')}
              className="inline-flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" /> Download for macOS
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Intel & Apple Silicon</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 sm:p-10 mb-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{r}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div><span className="font-medium text-gray-900">Version:</span> v{version}</div>
            <div><span className="font-medium text-gray-900">File Size:</span> ~150MB (compressed)</div>
            <div><span className="font-medium text-gray-900">Release Date:</span> {downloadInfo?.publishedAt ? new Date(downloadInfo.publishedAt).toLocaleDateString() : 'June 2026'}</div>
            <div><span className="font-medium text-gray-900">License:</span> 14-day free trial included</div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Need help?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Visit our <Link href="/contact" className="text-brand font-medium hover:underline">Contact page</Link> or check the installation guide.
          </p>
          <p className="text-xs text-gray-400">
            Latest version: <span className="text-gray-500">v{version}</span>
          </p>
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showDialog === 'windows' ? 'Downloading Windows Desktop' :
               showDialog === 'mac' ? 'Downloading macOS Desktop' :
               showDialog === 'mac-arm64' ? 'Downloading macOS (Apple Silicon)' :
               'Downloading Linux Desktop'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {downloading ? <Loader2 className="h-5 w-5 text-brand animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                <span className="text-sm text-gray-700">
                  {downloadInfo?.[showDialog]?.url?.startsWith('http')
                    ? 'Redirecting to download server...'
                    : 'Preparing download...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {downloading ? <Loader2 className="h-5 w-5 text-brand animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                <span className="text-sm text-gray-700">
                  {downloadInfo?.source === 'github' ? 'Downloading from GitHub Releases' : 'Downloading from server'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-700">Download starting...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand rounded-full h-2 transition-all duration-1000" style={{width: downloading ? '60%' : '100%'}} />
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              {!error && <p className="text-xs text-gray-500 text-center">
                {downloading ? 'Please wait...' : 'Download started!'}
              </p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
