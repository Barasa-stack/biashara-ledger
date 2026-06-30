'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';

export interface CityImage {
  url: string;
  label: string;
}

interface PageHeroProps {
  images: CityImage[];
  title: ReactNode;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  height?: string;
  showTrustBanner?: boolean;
  badgeWithoutTrust?: boolean;
}

export const defaultCityImages: CityImage[] = [
  { url: 'https://images.unsplash.com/photo-1574227492706-f65b24c3688a?w=1920&q=80', label: 'Marina Bay · Singapore' },
  { url: 'https://images.unsplash.com/photo-1693464550496-8a6b114585b8?w=1920&q=80', label: 'Upper Hill · Nairobi' },
  { url: 'https://images.unsplash.com/photo-1749058388308-744fdc8991ed?w=1920&q=80', label: 'Victoria Island · Lagos' },
  { url: 'https://images.unsplash.com/photo-1573422565615-e3d0b3c0d7c3?w=1920&q=80', label: 'Sandton · Johannesburg' },
  { url: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1920&q=80', label: 'Melbourne · Australia' },
  { url: 'https://images.unsplash.com/photo-1680198276344-3e820e68c825?w=1920&q=80', label: 'Cancún Beach Resort · Mexico' },
  { url: 'https://images.unsplash.com/photo-1771868453049-b7b4a4680b5c?w=1920&q=80', label: 'Construction Site · Urban Development' },
  { url: 'https://images.unsplash.com/photo-X0zbDrDtXAw?w=1920&q=80', label: 'Cavo Tagoo · Mykonos' },
  { url: 'https://images.unsplash.com/photo-SkTAXVu4UfU?w=1920&q=80', label: 'Rodeo Drive · Beverly Hills' },
  { url: 'https://images.unsplash.com/photo-1765246312031-87e7a216a543?w=1920&q=80', label: 'Chicago Skyline · Lake Michigan' },
  { url: 'https://images.unsplash.com/photo-1746208440749-b25fcc19e025?w=1920&q=80', label: 'Antigua · Tropical Beach' },
  { url: 'https://images.unsplash.com/photo-1706921255467-4236b197b530?w=1920&q=80', label: 'Business Class · Starlux A350' },
];

export default function PageHero({
  images,
  title,
  subtitle,
  badge,
  children,
  height = 'min-h-[60vh]',
  showTrustBanner = true,
  badgeWithoutTrust = false,
}: PageHeroProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className={`relative ${height} flex items-center overflow-hidden`}>
      {images.map((img, i) => (
        <div
          key={img.url}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={img.url}
            alt={img.label}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="absolute bottom-8 right-8 text-white/10 text-xs font-medium tracking-[0.3em] uppercase select-none">
        {images[current].label}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/15 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
        {showTrustBanner && (
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white/80">
              <span className="text-brand">Trusted</span> by 12,500+ <span className="text-brand">businesses</span> across 47+ countries
            </span>
          </div>
        )}
        {badge && !showTrustBanner && !badgeWithoutTrust && (
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-medium text-white/80">{badge}</span>
          </div>
        )}
        {badgeWithoutTrust && badge && (
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-medium text-white/80">{badge}</span>
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
