import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-dark border-t border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                  <span className="text-white font-bold text-lg">BL</span>
                </div>
                <span className="text-lg font-bold text-white">Biashara<span className="text-brand">Ledger</span></span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                The complete cloud and desktop business management platform for modern businesses.
              </p>
              <div className="flex items-center gap-2">
                <a href="tel:+254715434805" className="text-xs text-brand hover:text-brand-hover transition-colors">Call</a>
                <span className="text-xs text-white/30">or</span>
                <a href="https://wa.me/254715434805" className="text-xs text-brand hover:text-brand-hover transition-colors">WhatsApp +254715434805</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-white/50 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
                <Link href="/download" className="block text-sm text-white/50 hover:text-white transition-colors">Desktop App</Link>
                <span className="block text-sm text-white/50">Cloud Platform</span>
                <span className="block text-sm text-white/50">Integrations</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <div className="space-y-2.5">
                <Link href="/about" className="block text-sm text-white/50 hover:text-white transition-colors">About</Link>
                <Link href="/blog" className="block text-sm text-white/50 hover:text-white transition-colors">Blog</Link>
                <Link href="/contact" className="block text-sm text-white/50 hover:text-white transition-colors">Contact</Link>
                <span className="block text-sm text-white/50">Careers</span>
                <span className="block text-sm text-white/50">Press Kit</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/50">Help Center</span>
                <span className="block text-sm text-white/50">Documentation</span>
                <span className="block text-sm text-white/50">API Reference</span>
                <span className="block text-sm text-white/50">Community</span>
                <span className="block text-sm text-white/50">Status</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/50">Privacy Policy</span>
                <span className="block text-sm text-white/50">Terms of Service</span>
                <span className="block text-sm text-white/50">Data Processing</span>
                <span className="block text-sm text-white/50">Cookie Policy</span>
                <span className="block text-sm text-white/50">GDPR</span>
              </div>
            </div>
          </div>

          <div className="border-t border-dark-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} BiasharaLedger. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-white/30">Follow us:</span>
              {['Twitter', 'LinkedIn', 'Facebook', 'YouTube'].map((s) => (
                <span key={s} className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
