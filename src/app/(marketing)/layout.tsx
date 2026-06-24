import Link from 'next/link';
import { Download } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              <span className="text-lg font-bold text-brand">BiasharaLedger</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-sm text-[#000000] hover:text-brand transition-colors font-medium">Features</Link>
              <Link href="/pricing" className="text-sm text-[#000000] hover:text-brand transition-colors font-medium">Pricing</Link>
              <Link href="/download" className="text-sm text-brand hover:text-brand-hover transition-colors font-semibold flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Download
              </Link>
              <Link href="/about" className="text-sm text-[#000000] hover:text-brand transition-colors font-medium">About</Link>
              <Link href="/contact" className="text-sm text-[#000000] hover:text-brand transition-colors font-medium">Contact</Link>
              <Link href="/blog" className="text-sm text-[#000000] hover:text-brand transition-colors font-medium">Blog</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="hidden sm:inline text-sm font-medium text-[#000000] hover:text-brand transition-colors">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="hidden sm:inline bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start Free Trial
              </Link>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-dark border-t border-dark-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BL</span>
                </div>
                <span className="text-base font-bold text-white">BiasharaLedger</span>
              </div>
              <p className="text-sm text-white/60">Accounting software built for Kenyan small businesses.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="/features" className="block text-sm text-white/60 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
                <Link href="/download" className="block text-sm text-white/60 hover:text-white transition-colors">Windows App</Link>
                <Link href="/about" className="block text-sm text-white/60 hover:text-white transition-colors">About</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-sm text-white/60 hover:text-white transition-colors">Blog</Link>
                <Link href="/contact" className="block text-sm text-white/60 hover:text-white transition-colors">Contact</Link>
                <span className="block text-sm text-white/60">Help Center</span>
                <span className="block text-sm text-white/60">API Docs</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-white/60">Privacy Policy</span>
                <span className="block text-sm text-white/60">Terms of Service</span>
                <span className="block text-sm text-white/60">Data Processing</span>
              </div>
            </div>
          </div>
          <div className="border-t border-dark-border mt-8 pt-8 text-center">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} BiasharaLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
