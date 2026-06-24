'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Download } from 'lucide-react';

const links = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download for Windows', highlight: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-1.5 p-2"
        aria-label="Open navigation menu"
      >
        <span className="block w-5 h-0.5 bg-[#000000] rounded" />
        <span className="block w-5 h-0.5 bg-[#000000] rounded" />
        <span className="block w-5 h-0.5 bg-[#000000] rounded" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <span className="text-lg font-bold text-brand">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2" aria-label="Close navigation menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    l.highlight
                      ? 'text-brand bg-brand/5 hover:bg-brand/10'
                      : 'text-[#000000] hover:bg-brand/5 hover:text-brand'
                  }`}
                >
                  {l.highlight && <Download className="h-4 w-4" />}
                  {l.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-[#000000] hover:bg-brand/5 hover:text-brand rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="mt-1 bg-brand hover:bg-brand-hover text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Start Free Trial
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
