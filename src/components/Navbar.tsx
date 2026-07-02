'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showWhite = !isHome || scrolled;
  const textColor = 'text-white/80 hover:text-white';
  const textColorLogo = 'text-white';
  const bgClass = showWhite ? 'bg-black/60 backdrop-blur-md border-b border-white/10' : 'bg-transparent';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 group-hover:shadow-brand/30 transition-shadow">
              <span className="text-white font-bold text-lg">BL</span>
            </div>
            <span className={`text-lg font-bold transition-colors ${textColorLogo}`}>
              Biashara<span className="text-brand">Ledger</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {[
              { href: '/features', label: 'Features' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/download', label: 'Desktop' },
              { href: '/industries', label: 'Industries' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-medium transition-colors ${textColor}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className={`hidden sm:inline bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 ${showWhite ? 'bg-brand hover:bg-brand-hover' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20'}`}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="hidden sm:inline bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand/25"
            >
              Start Free Trial
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 transition-colors ${showWhite ? 'text-gray-900' : 'text-white'}`}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="bg-white border-t border-gray-100 px-4 py-6 space-y-4">
          {[
            { href: '/features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/download', label: 'Desktop' },
            { href: '/industries', label: 'Industries' },
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-brand py-2"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="block text-center bg-brand hover:bg-brand-hover text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            onClick={() => setMobileOpen(false)}
            className="block text-center bg-brand hover:bg-brand-hover text-white px-5 py-3 rounded-xl text-sm font-semibold"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
