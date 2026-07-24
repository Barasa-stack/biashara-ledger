import Link from 'next/link';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/15 via-transparent to-transparent pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[150px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[120px] pointer-events-none" />
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                  <span className="text-white font-bold text-lg">BL</span>
                </div>
                <span className="text-lg font-bold text-white">Biashara<span className="text-brand">Ledger</span></span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                The complete cloud and desktop business management platform for modern businesses.
              </p>

            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-white/50 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
                <Link href="/download" className="block text-sm text-white/50 hover:text-white transition-colors">Desktop App</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <div className="space-y-2.5">
                <Link href="/about" className="block text-sm text-white/50 hover:text-white transition-colors">About</Link>
                <Link href="/articles" className="block text-sm text-white/50 hover:text-white transition-colors">Articles</Link>
                <Link href="/contact" className="block text-sm text-white/50 hover:text-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2.5">
                <Link href="/privacy-policy" className="block text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="block text-sm text-white/50 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/cookie-policy" className="block text-sm text-white/50 hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} BiasharaLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
