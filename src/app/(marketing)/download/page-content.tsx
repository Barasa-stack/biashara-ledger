'use client';

import Link from 'next/link';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const desktopImages: CityImage[] = [
  { url: '/images/backgrounds/desktop/bg.jpg', label: 'Sleek Tech · Modern Workspace' },
];

const PLATFORMS = [
  { name: 'Windows', icon: Monitor, desc: 'Native desktop app for Windows 10/11' },
  { name: 'macOS', icon: Monitor, desc: 'Native desktop app for Intel & Apple Silicon' },
  { name: 'Linux', icon: Monitor, desc: 'Native desktop app for Linux distributions' },
  { name: 'Android', icon: Smartphone, desc: 'Mobile app for Android devices' },
];

export default function DownloadPage() {
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
            Desktop & Mobile
            <br />
            <span className="gradient-text-shine">Coming Soon</span>
          </div>
        }
        subtitle="We're building native desktop and mobile apps so you can use BiasharaLedger offline, anywhere. Sign up for the cloud version today and get early access when we launch."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Offline Access — Coming Soon</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            We're developing native desktop and mobile applications to give you full offline access.
            In the meantime, you can use BiasharaLedger online from any browser.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center hover:border-brand/30 transition-all">
                <Icon size={40} className="text-brand mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{p.name}</h3>
                <p className="text-sm text-white/50 mb-4">{p.desc}</p>
                <span className="inline-block text-xs bg-brand/20 text-brand px-3 py-1 rounded-full font-medium">Coming Soon</span>
              </div>
            );
          })}
        </div>

        <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-10">
          <h3 className="text-xl font-semibold text-white mb-3">Use BiasharaLedger Online Now</h3>
          <p className="text-sm text-white/60 mb-6 max-w-lg mx-auto">
            Access all features from any browser — no installation needed.
            Your data syncs seamlessly when desktop and mobile apps launch.
          </p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2"
          >
            Get Started Online <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
