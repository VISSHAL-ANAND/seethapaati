import type { Metadata } from 'next';
import type { CategoryDto, ProductDto } from '@seethapaati/contracts';
import { ShopClient } from '../../components/storefront/ShopClient';
import { getApiBaseUrl, fetchWithRetry } from '../../lib/api-client';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Artisanal Pantry Collection — Seethapaati',
  description:
    'Explore our collection of heirloom spice powders, hand-blended teas, and botanical mixes prepared according to traditional culinary recipes.',
  openGraph: {
    title: 'Artisanal Pantry Collection — Seethapaati',
    description:
      'Explore our collection of heirloom spice powders, hand-blended teas, and botanical mixes prepared according to traditional culinary recipes.',
    url: 'https://seethapaati.com/shop',
    siteName: 'Seethapaati',
    images: [{ url: 'https://seethapaati.com/images/masala.jpg', width: 1200, height: 630 }],
  },
};

async function getInitialShopData(): Promise<{ products: ProductDto[]; categories: CategoryDto[] }> {
  const apiUrl = getApiBaseUrl();
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetchWithRetry(`${apiUrl}/catalog/products?limit=36&sortBy=createdAt&sortDir=desc`, { next: { revalidate: 60 } }, 2, 8000),
      fetchWithRetry(`${apiUrl}/catalog/categories`, { next: { revalidate: 60 } }, 2, 8000),
    ]);

    const products = productsRes.ok ? await productsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];

    return {
      products: Array.isArray(products) ? products : (products?.data ?? []),
      categories: Array.isArray(categories) ? categories : (categories?.data ?? []),
    };
  } catch (err) {
    console.error('[getInitialShopData] Error fetching initial shop data:', (err as Error).message);
    return { products: [], categories: [] };
  }
}

export default async function ShopPage() {
  const { products, categories } = await getInitialShopData();

  return (
    <ShopClient
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
