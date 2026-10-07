'use client';

import { useEffect, useState } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { CategoryDto, ProductDto } from '@seethapaati/contracts';
import { fetchApi } from '../../lib/api-client';
import { ProductCard } from '../../components/storefront/ProductCard';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export default function ShopPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    fetchApi<CategoryDto[]>('/catalog/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    let sortBy: 'createdAt' | 'name' | 'priceCents' = 'createdAt';
    let sortDir: 'asc' | 'desc' = 'desc';

    if (sort === 'newest') {
      sortBy = 'createdAt';
      sortDir = 'desc';
    } else if (sort === 'price-asc') {
      sortBy = 'priceCents';
      sortDir = 'asc';
    } else if (sort === 'price-desc') {
      sortBy = 'priceCents';
      sortDir = 'desc';
    } else if (sort === 'name-asc') {
      sortBy = 'name';
      sortDir = 'asc';
    }

    const params = new URLSearchParams({
      page: '1',
      limit: '36',
      sortBy,
      sortDir,
    });
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
  }, [category, query, sort, retry]);

  const selectedCategoryName = categories.find((item) => item.slug === category)?.name;
  const isFiltered = Boolean(category || query.trim());

  function resetFilters() {
    setCategory('');
    setQuery('');
    setSort('newest');
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-24 pt-12 md:px-10 md:pb-32 md:pt-16">
      {/* Editorial Header */}
      <header className="border-b border-[#E3DFD7] pb-10 md:pb-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
              The Seethapaati Collection
            </p>
            <h1 className="mt-3 font-serif text-5xl font-normal leading-[1.0] tracking-[-0.04em] text-[#181513] md:text-7xl">
              A considered <em className="italic text-[#A66B18]">selection.</em>
            </h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#181513]/65">
            Purity of ingredients, traditional craft, and pantry staples prepared for everyday rituals.
          </p>
        </div>
      </header>

      {/* Filter and Controls Toolbar */}
      <section aria-label="Browse products" className="mt-8 md:mt-10">
        <div className="flex flex-col gap-5 border-b border-[#E3DFD7] pb-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Tabs */}
          <nav aria-label="Product categories" className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-1 text-xs uppercase tracking-[0.16em] md:gap-7">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={
                'relative shrink-0 py-2 transition-colors ' +
                (category === '' ? 'font-medium text-[#A66B18]' : 'text-[#181513]/60 hover:text-[#181513]')
              }
            >
              All Offerings
              {category === '' && <span className="absolute inset-x-0 -bottom-[5px] h-[2px] bg-[#B8860B]" />}
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCategory(item.slug)}
                className={
                  'relative shrink-0 py-2 transition-colors ' +
                  (category === item.slug ? 'font-medium text-[#A66B18]' : 'text-[#181513]/60 hover:text-[#181513]')
                }
              >
                {item.name}
                {category === item.slug && <span className="absolute inset-x-0 -bottom-[5px] h-[2px] bg-[#B8860B]" />}
              </button>
            ))}
          </nav>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative flex items-center min-w-[220px] flex-1 sm:max-w-xs border-b border-[#181513]/25 focus-within:border-[#B8860B] transition-colors">
              <Search className="h-3.5 w-3.5 text-[#181513]/40 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search collection…"
                className="w-full bg-transparent py-1.5 text-xs text-[#181513] placeholder:text-[#181513]/40 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-[#181513]/40 hover:text-[#181513]"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sorting Control */}
            <div className="flex items-center gap-2 border-b border-[#181513]/25 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#181513]/40" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-transparent text-xs text-[#181513] outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#181513]/60">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[#181513]">
              {selectedCategoryName || 'Full Collection'}
            </span>
            <span>·</span>
            <span>
              {loading
                ? 'Curating items…'
                : `${products.length} ${products.length === 1 ? 'item' : 'items'}`}
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#A66B18] underline underline-offset-4 hover:text-[#181513]"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Product Grid / States */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-8 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#ECE8E0]" />
                <div className="mt-4 h-4 w-3/4 bg-[#ECE8E0]" />
                <div className="mt-2 h-3 w-1/2 bg-[#ECE8E0]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50/50 p-12 text-center my-12">
            <p className="font-serif text-2xl text-[#181513]">The collection could not be loaded</p>
            <p className="mt-2 text-xs text-[#181513]/65">{error}</p>
            <button
              type="button"
              onClick={() => setRetry((v) => v + 1)}
              className="mt-6 border border-[#181513] px-6 py-2.5 text-xs uppercase tracking-[0.16em] text-[#181513] hover:bg-[#181513] hover:text-[#F7F5F0] transition"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-[#E3DFD7] bg-white/30 py-24 text-center my-10">
            <p className="font-serif text-3xl tracking-tight text-[#181513]">No offerings found</p>
            <p className="mt-2 text-xs text-[#181513]/60">
              There are no products matching your selected category or search keyword.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
            >
              View Full Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-8 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
