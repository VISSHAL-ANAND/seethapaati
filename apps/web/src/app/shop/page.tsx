import type { Metadata } from 'next';
import type { CategoryDto, ProductDto } from '@seethapaati/contracts';
import { ShopClient } from '../../components/storefront/ShopClient';

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${apiUrl}/catalog/products?limit=36&sortBy=createdAt&sortDir=desc`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/catalog/categories`, { next: { revalidate: 60 } }),
    ]);

    const products = productsRes.ok ? await productsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];

    return {
      products: Array.isArray(products) ? products : (products?.data ?? []),
      categories: Array.isArray(categories) ? categories : (categories?.data ?? []),
    };
  } catch {
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
