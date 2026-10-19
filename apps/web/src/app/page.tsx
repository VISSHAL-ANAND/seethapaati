import type { Metadata } from 'next';
import type { ProductDto } from '@seethapaati/contracts';
import { HomeClient } from '../components/storefront/HomeClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Seethapaati — Heirloom South Indian Staples & Handcrafted Masalas',
  description:
    'Purveyors of heirloom South Indian culinary staples, heritage masalas, cold-stone ground spice blends, and botanical malts.',
  openGraph: {
    title: 'Seethapaati — Heirloom South Indian Staples & Handcrafted Masalas',
    description:
      'Purveyors of heirloom South Indian culinary staples, heritage masalas, cold-stone ground spice blends, and botanical malts.',
    url: 'https://seethapaati.com',
    siteName: 'Seethapaati',
    images: [
      {
        url: 'https://seethapaati.com/images/masala.jpg',
        width: 1200,
        height: 630,
        alt: 'Seethapaati Artisanal Pantry',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seethapaati — Heirloom South Indian Staples',
    description:
      'Purveyors of heirloom South Indian culinary staples, heritage masalas, cold-stone ground spice blends, and botanical malts.',
    images: ['https://seethapaati.com/images/masala.jpg'],
  },
};

async function getProducts(): Promise<ProductDto[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/catalog/products?limit=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://seethapaati.com/#organization',
        name: 'Seethapaati',
        url: 'https://seethapaati.com',
        logo: 'https://seethapaati.com/images/logo.png',
        description:
          'Purveyors of heirloom South Indian culinary staples, heritage masalas, cold-stone ground spice blends, and botanical malts.',
        sameAs: [
          'https://www.instagram.com/seethapaati',
          'https://twitter.com/seethapaati',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://seethapaati.com/#website',
        url: 'https://seethapaati.com',
        name: 'Seethapaati',
        publisher: {
          '@id': 'https://seethapaati.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://seethapaati.com/shop?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient initialProducts={products} />
    </>
  );
}
