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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<CategoryDto[]>('/catalog/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ page: '1', limit: '24', sortBy: 'createdAt', sortDir: 'desc' });
    if (category) params.set('categorySlug', category);
    if (query.trim()) params.set('q', query.trim());

    fetchApi<ProductDto[]>('/catalog/products?' + params.toString())
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setProducts([]);
        setError(reason instanceof Error ? reason.message : 'The collection could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, query]);

  const selectedCategory = categories.find((item) => item.slug === category)?.name;

  return (
    <main className="editorial-page mx-auto max-w-[1440px] px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-20">
      <header className="grid gap-8 border-b border-[#E3DFD7] pb-10 md:grid-cols-[1fr_300px] md:items-end md:gap-16 md:pb-14">
        <div className="max-w-3xl">
          <p className="eyebrow"><span className="eyebrow-dot" /> The Seethapaati collection</p>
          <h1 className="mt-5 font-serif text-6xl font-normal leading-[0.9] tracking-[-0.055em] md:text-8xl">
            A considered <em className="text-[#A66B18]">selection.</em>
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-7 text-[#181513]/65 md:justify-self-end">
          Explore the collection at your own pace. Product details, prices and availability are kept current by our store.
        </p>
      </header>

      <section aria-label="Browse products" className="mt-7 md:mt-9">
        <div className="flex flex-col gap-5 border-b border-[#E3DFD7] pb-5 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Product categories" className="-mx-1 flex gap-6 overflow-x-auto px-1 pb-1 text-[10px] uppercase tracking-[0.18em] md:gap-8">
            <button
              type="button"
              aria-pressed={category === ''}
              onClick={() => setCategory('')}
              className={'relative shrink-0 py-2 transition-colors ' + (category === '' ? 'text-[#A66B18]' : 'text-[#181513]/55 hover:text-[#181513]')}
            >
              All products
              {category === '' && <span className="absolute inset-x-0 -bottom-[1px] h-px bg-[#B8860B]" />}
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={category === item.slug}
                onClick={() => setCategory(item.slug)}
                className={'relative shrink-0 py-2 transition-colors ' + (category === item.slug ? 'text-[#A66B18]' : 'text-[#181513]/55 hover:text-[#181513]')}
              >
                {item.name}
                {category === item.slug && <span className="absolute inset-x-0 -bottom-[1px] h-px bg-[#B8860B]" />}
              </button>
            ))}
          </nav>

          <label className="flex w-full items-center gap-3 border-b border-[#181513]/25 py-2 focus-within:border-[#B8860B] md:max-w-[270px]">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#181513]/45">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a product"
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-[#181513]/35 focus:shadow-none"
              aria-label="Search products"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-[10px] uppercase tracking-[0.12em] text-[#181513]/55 hover:text-[#181513]" aria-label="Clear search">
                Clear
              </button>
            )}
          </label>
        </div>

        <div className="flex min-h-10 items-center justify-between gap-4 pt-3">
          <p className="text-[9px] uppercase tracking-[0.17em] text-[#181513]/45" aria-live="polite">
            {loading ? 'Curating the collection…' : error ? 'Collection unavailable' : selectedCategory || 'All products'}
          </p>
          {!loading && !error && <p className="text-[9px] uppercase tracking-[0.17em] text-[#181513]/45">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</p>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-7 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#ECE8E0]" />
                <div className="mt-4 h-4 w-2/3 bg-[#ECE8E0]" />
                <div className="mt-3 h-3 w-1/3 bg-[#ECE8E0]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border-y border-[#E3DFD7] py-20 text-center">
            <p className="font-serif text-3xl">The collection is taking a moment.</p>
            <p className="mt-3 text-sm text-[#181513]/55">{error}</p>
            <button type="button" onClick={() => { setQuery((value) => value); setCategory((value) => value); }} className="mt-6 text-[10px] uppercase tracking-[0.18em] underline underline-offset-4">
              Adjust your filters to try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="border-y border-[#E3DFD7] py-24 text-center">
            <p className="font-serif text-4xl tracking-tight">Nothing in view.</p>
            <p className="mt-3 text-sm text-[#181513]/55">Try another search or return to the full collection.</p>
            <button type="button" onClick={() => { setQuery(''); setCategory(''); }} className="mt-7 text-[10px] uppercase tracking-[0.18em] text-[#A66B18] underline underline-offset-4">
              View all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-7 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </main>
  );
}
