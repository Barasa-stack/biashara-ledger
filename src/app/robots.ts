import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/sign-in/', '/sign-up/', '/renew/'],
    },
    sitemap: 'https://biasharaledsgr.com/sitemap.xml',
  };
}
// deployment: Mon Jul  6 08:23:50 EAT 2026
