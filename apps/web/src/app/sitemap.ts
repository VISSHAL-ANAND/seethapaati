import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://seethapaati.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/shipping',
    '/returns',
    '/terms-and-conditions',
    '/privacy-policy',
  ];

  const curatedProducts = [
    '/shop/one-powder-for-all',
    '/shop/abc-malt-health-mix',
    '/shop/premium-ceylon-tea-blend',
    '/shop/traditional-rasam-powder',
    '/shop/traditional-nuts-seed-blend',
  ];

  const now = new Date();

  const staticUrls = routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const productUrls = curatedProducts.map((slug) => ({
    url: `${SITE_URL}${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...staticUrls, ...productUrls];
}
