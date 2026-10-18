import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ProductDto } from '@seethapaati/contracts';
import { ProductDetailClient } from '../../../components/storefront/ProductDetailClient';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/catalog/products?limit=50`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const products = Array.isArray(data) ? data : (data.data ?? []);
      if (products.length > 0) {
        return products.map((p: any) => ({ slug: p.slug }));
      }
    }
  } catch {
    // Fallback if API is offline during build
  }

  return [
    { slug: 'one-powder-for-all' },
    { slug: 'abc-malt-health-mix' },
    { slug: 'premium-ceylon-tea-blend' },
    { slug: 'traditional-filter-coffee' },
    { slug: 'heritage-sambar-powder' },
  ];
}

async function getProduct(slug: string): Promise<ProductDto | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/catalog/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as ProductDto;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Delicacy Unavailable — Seethapaati',
      description: 'The requested delicacy is currently unavailable in our collection.',
    };
  }

  const firstVariant = product.variants?.[0];
  const priceFormatted = firstVariant ? `₹${(firstVariant.priceCents / 100).toLocaleString('en-IN')}` : '';
  const title = `${product.name} ${priceFormatted ? `(${priceFormatted})` : ''} — Seethapaati`;
  const description =
    product.description?.slice(0, 160) ||
    `Experience the authentic taste of ${product.name}, handcrafted using traditional heirloom recipes.`;

  const imageUrl = product.images?.[0]?.url || 'https://seethapaati.com/images/masala.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://seethapaati.com/shop/${slug}`,
      siteName: 'Seethapaati',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const primaryVariant = product.variants?.find((v) => v.isAvailable) ?? product.variants?.[0];
  const imageUrl = product.images?.[0]?.url || 'https://seethapaati.com/images/masala.jpg';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images && product.images.length > 0 ? product.images.map((i) => i.url) : [imageUrl],
    description: product.description,
    sku: primaryVariant?.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Seethapaati',
    },
    offers: {
      '@type': 'Offer',
      url: `https://seethapaati.com/shop/${product.slug}`,
      priceCurrency: 'INR',
      price: primaryVariant ? (primaryVariant.priceCents / 100).toFixed(2) : '0.00',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: primaryVariant?.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Seethapaati',
      },
    },
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://seethapaati.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Collection',
        item: 'https://seethapaati.com/shop',
      },
      ...(product.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category.name,
              item: `https://seethapaati.com/shop?category=${product.category.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: product.name,
              item: `https://seethapaati.com/shop/${product.slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.name,
              item: `https://seethapaati.com/shop/${product.slug}`,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
