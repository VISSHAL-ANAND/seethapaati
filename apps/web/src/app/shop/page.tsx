'use client';

import { useEffect, useState } from 'react';
import type { CategoryDto, ProductDto } from '@seethapaati/contracts';
import { fetchApi } from '../../lib/api-client';
import { ProductCard } from '../../components/storefront/ProductCard';

export default function ShopPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<CategoryDto[]>('/catalog/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '24', sortBy: 'createdAt', sortDir: 'desc' });
    if (category) params.set('categorySlug', category);
    if (query.trim()) params.set('q', query.trim());
    fetchApi<ProductDto[]>('/catalog/products?' + params.toString())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, query]);

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#B8860B]">Collection</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight md:text-7xl">The Shop</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-[#181513]/65">Browse the currently available collection. Prices and availability are supplied by the commerce API.</p>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-y border-[#E3DFD7] py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-5 overflow-x-auto text-[10px] uppercase tracking-[0.18em]">
          <button onClick={() => setCategory('')} className={category === '' ? 'text-[#B8860B]' : 'text-[#181513]/55'}>All</button>
          {categories.map((item) => (
            <button key={item.id} onClick={() => setCategory(item.slug)} className={category === item.slug ? 'text-[#B8860B]' : 'text-[#181513]/55'}>{item.name}</button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search collection" className="w-full border-b border-[#181513]/25 bg-transparent px-0 py-2 text-sm outline-none placeholder:text-[#181513]/35 md:w-64" aria-label="Search products" />
      </div>

      {loading ? (
        <div className="py-24 text-center text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Loading collection</div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center font-serif text-3xl text-[#181513]/45">No products found.</div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-7 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </main>
  );
}
