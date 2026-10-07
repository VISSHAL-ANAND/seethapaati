'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit3,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  TrendingDown,
  Trash2,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Star,
  Tag,
  LayoutGrid,
  List,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Sliders,
  Eye,
} from 'lucide-react';
import type {
  CategoryDto,
  ProductDto,
  ProductVariantDto,
  MerchandisingLabel,
  MerchandisingPlacement,
  ProductMerchandising,
  HeroConfiguration,
} from '@seethapaati/contracts';
import { fetchApi } from '../../../lib/api-client';

const CURATED_ASSETS = [
  { name: 'One Powder for All / Masala', url: '/images/masala.jpg' },
  { name: 'Health Mix / ABC Malt', url: '/images/mix.png' },
  { name: 'Premium Ceylon Tea', url: '/images/tea.png' },
  { name: 'Traditional Nuts & Seed Blend', url: '/images/nuts.png' },
];

const MERCHANDISING_BADGES: { value: MerchandisingLabel; label: string; desc: string }[] = [
  { value: 'NEW', label: 'New', desc: 'Fresh addition to the collection' },
  { value: 'NEW_ARRIVAL', label: 'New Arrival', desc: 'Recently launched batch' },
  { value: 'FEATURED', label: 'Featured', desc: 'Editorial choice highlight' },
  { value: 'BESTSELLER', label: 'Bestseller', desc: 'Most loved by patrons' },
  { value: 'LIMITED', label: 'Limited', desc: 'Small batch / seasonal run' },
  { value: 'SALE', label: 'Sale', desc: 'Special promotional pricing' },
  { value: 'COMING_SOON', label: 'Coming Soon', desc: 'Preview before release' },
];

const HOMEPAGE_PLACEMENTS: { value: MerchandisingPlacement; label: string; desc: string }[] = [
  { value: 'HERO', label: 'Show in Hero', desc: 'Prominent spotlight at the top of the homepage' },
  { value: 'NEW_ARRIVALS', label: 'Show in New Arrivals', desc: 'Feature in the New Arrivals showcase' },
  { value: 'FEATURED', label: 'Show in Featured Collection', desc: 'Showcase in primary curated grid' },
  { value: 'BESTSELLERS', label: 'Show in Bestsellers', desc: 'Highlight in top-patron favorites' },
  { value: 'SALE', label: 'Show in Sale', desc: 'Include in promotional offers section' },
  { value: 'RECOMMENDED', label: 'Show in Recommended', desc: 'Display in curated pairing recommendations' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View mode: 'cards' (editorial luxury cards) | 'table' (editorial ledger)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [placementFilter, setPlacementFilter] = useState<'ALL' | MerchandisingPlacement>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price-low' | 'price-high' | 'priority'>('newest');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [variantsProduct, setVariantsProduct] = useState<ProductDto | null>(null);
  const [imagesProduct, setImagesProduct] = useState<ProductDto | null>(null);
  const [stockVariant, setStockVariant] = useState<{ product: ProductDto; variant: ProductVariantDto } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        fetchApi<CategoryDto[]>('/catalog/categories').catch(() => []),
        fetchApi<ProductDto[]>('/catalog/admin/products?limit=100').catch(async () => {
          return fetchApi<ProductDto[]>('/catalog/products?limit=100');
        }),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load catalogue data.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  function notify(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification((prev) => (prev?.message === message ? null : prev));
      }, 5000);
    }
  }

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (categoryFilter !== 'ALL' && product.category?.id !== categoryFilter && product.category?.slug !== categoryFilter) {
          return false;
        }
        if (statusFilter !== 'ALL' && product.status !== statusFilter) {
          return false;
        }
        if (placementFilter !== 'ALL') {
          const placements = product.merchandising?.placements || [];
          if (!placements.includes(placementFilter)) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = product.name.toLowerCase().includes(q);
          const matchesSlug = product.slug.toLowerCase().includes(q);
          const matchesDesc = product.description?.toLowerCase().includes(q);
          const matchesSku = product.variants?.some((v) => v.sku.toLowerCase().includes(q));
          if (!matchesName && !matchesSlug && !matchesDesc && !matchesSku) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const prioA = a.merchandising?.priority ?? 0;
          const prioB = b.merchandising?.priority ?? 0;
          return prioB - prioA;
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-low') {
          const minA = Math.min(...(a.variants?.map((v) => v.priceCents) || [0]));
          const minB = Math.min(...(b.variants?.map((v) => v.priceCents) || [0]));
          return minA - minB;
        }
        if (sortBy === 'price-high') {
          const maxA = Math.max(...(a.variants?.map((v) => v.priceCents) || [0]));
          const maxB = Math.max(...(b.variants?.map((v) => v.priceCents) || [0]));
          return maxB - maxA;
        }
        // Newest default
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, categoryFilter, statusFilter, placementFilter, searchQuery, sortBy]);

  // Activate / Deactivate product
  async function toggleProductStatus(product: ProductDto) {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    setBusy(true);
    try {
      await fetchApi(`/catalog/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      notify('success', `Product "${product.name}" set to ${nextStatus}.`);
      await loadData();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to update product status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      {/* Editorial Luxury Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#E3DFD7] pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#B8860B]" />
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#181513]/60">Merchandising & Catalogue</span>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-[#181513] md:text-5xl">
            Product Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#181513]/65">
            Curate Seethapaati delicacies, configure luxury packaging formats, dynamic variant pricing, inventory allocations, and editorial storefront placements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex border border-[#E3DFD7] bg-[#F7F5F0] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.16em] transition ${
                viewMode === 'cards' ? 'bg-[#181513] text-[#F7F5F0]' : 'text-[#181513]/60 hover:text-[#181513]'
              }`}
              title="Editorial Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.16em] transition ${
                viewMode === 'table' ? 'bg-[#181513] text-[#F7F5F0]' : 'text-[#181513]/60 hover:text-[#181513]'
              }`}
              title="Editorial Ledger View"
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 border border-[#E3DFD7] bg-[#F7F5F0] px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#181513] transition hover:border-[#181513] disabled:opacity-50"
            title="Refresh catalogue"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#181513] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824] shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Create Offering
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          role="alert"
          className={`mt-6 flex items-start justify-between border p-4 text-xs transition-all ${
            notification.type === 'success'
              ? 'border-[#B8860B]/40 bg-[#B8860B]/10 text-[#181513]'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B8860B]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <p className="font-sans font-medium">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[#181513]/50 hover:text-[#181513]"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Merchandising Bar */}
      <div className="mt-8 space-y-4 border-b border-[#E3DFD7] pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#181513]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, slug or SKU..."
                className="w-full border border-[#E3DFD7] bg-[#F7F5F0] py-2 pl-9 pr-8 text-xs text-[#181513] placeholder:text-[#181513]/35 focus:border-[#B8860B] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#181513]/40 hover:text-[#181513]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-2 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Merchandising Placement Filter */}
            <select
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value as any)}
              className="border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-2 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
              aria-label="Filter by storefront placement"
            >
              <option value="ALL">All Placements</option>
              <option value="HERO">★ Hero Spotlight</option>
              <option value="NEW_ARRIVALS">New Arrivals</option>
              <option value="FEATURED">Featured Collection</option>
              <option value="BESTSELLERS">Bestsellers</option>
              <option value="SALE">Sale / Promotional</option>
              <option value="RECOMMENDED">Recommended</option>
            </select>

            {/* Status Tabs */}
            <div className="flex border border-[#E3DFD7] bg-[#F7F5F0] text-[10px] uppercase tracking-[0.16em]">
              {(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 transition-colors ${
                    statusFilter === st ? 'bg-[#181513] text-[#F7F5F0]' : 'text-[#181513]/60 hover:text-[#181513]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#181513]/50">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border-b border-[#181513]/30 bg-transparent py-1 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
              aria-label="Sort products"
            >
              <option value="newest">Newest First</option>
              <option value="priority">Merchandising Priority</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || placementFilter !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] uppercase tracking-[0.16em]">
            <span className="text-[#181513]/40">Active Filters:</span>
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2 py-0.5">
                Category: {categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('ALL')} className="hover:text-red-600">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {placementFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 border border-[#B8860B]/40 bg-[#B8860B]/10 px-2 py-0.5 text-[#B8860B]">
                Placement: {placementFilter}
                <button type="button" onClick={() => setPlacementFilter('ALL')} className="hover:text-red-600">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2 py-0.5">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-red-600">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2 py-0.5">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-600">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('ALL');
                setPlacementFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[#B8860B] underline hover:text-[#181513]"
            >
              Reset all
            </button>
            <span className="ml-auto text-[#181513]/50">
              Showing {filteredProducts.length} of {products.length} offering(s)
            </span>
          </div>
        )}
      </div>

      {/* Main Catalogue View */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#181513] border-t-transparent" />
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#181513]/50">Loading Curated Catalogue...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#E3DFD7] p-12 text-center md:p-20">
          <Package className="mx-auto h-10 w-10 text-[#181513]/25 stroke-[1.2]" />
          <h2 className="mt-4 font-serif text-2xl text-[#181513]">No offerings match your selection</h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#181513]/60">
            {products.length === 0
              ? 'Your product collection is currently empty. Create your first offering to start merchandising on the storefront.'
              : 'No products match your active search and filter criteria. Try adjusting your query or resetting filters.'}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            {products.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
              >
                + Create First Offering
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setPlacementFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="border border-[#181513] px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#181513] transition hover:bg-[#181513] hover:text-[#F7F5F0]"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* EDITORIAL CARDS VIEW */
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const primaryImage = product.images?.[0]?.url;
            const primaryVariant = product.variants?.[0];
            const totalStock = product.variants?.reduce(
              (sum, v) => sum + (v.quantityAvailable ?? v.availableStock ?? 0),
              0
            ) ?? 0;

            const minPrice = product.variants?.length
              ? Math.min(...product.variants.map((v) => v.priceCents))
              : 0;
            const maxPrice = product.variants?.length
              ? Math.max(...product.variants.map((v) => v.priceCents))
              : 0;
            const priceRange =
              minPrice === maxPrice
                ? `₹${(minPrice / 100).toLocaleString('en-IN')}`
                : `₹${(minPrice / 100).toLocaleString('en-IN')} – ₹${(maxPrice / 100).toLocaleString('en-IN')}`;

            const compareAt = primaryVariant?.compareAtPriceCents;
            const hasDiscount = compareAt && compareAt > primaryVariant.priceCents;
            const discountPct = hasDiscount
              ? Math.round(((compareAt - primaryVariant.priceCents) / compareAt) * 100)
              : null;

            const badge = product.merchandising?.badge;
            const placements = product.merchandising?.placements || [];
            const isHero = placements.includes('HERO');

            return (
              <article
                key={product.id}
                className="group relative flex flex-col justify-between border border-[#E3DFD7] bg-[#F7F5F0] transition hover:border-[#181513]/40 hover:shadow-md"
              >
                {/* Visual Media Header */}
                <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#E3DFD7] bg-[#ECE8E0]">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.images?.[0]?.altText || product.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center">
                      <span className="font-serif text-2xl text-[#181513]/25">{product.name}</span>
                    </div>
                  )}

                  {/* Top-Left Merchandising Primary Badge */}
                  {badge && (
                    <div className="absolute left-3 top-3">
                      <span className="border border-[#B8860B]/60 bg-[#F7F5F0]/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#B8860B] shadow-xs backdrop-blur-xs">
                        {badge.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Top-Right Hero Spotlight Ribbon */}
                  {isHero && (
                    <div className="absolute right-3 top-3">
                      <span className="flex items-center gap-1 border border-[#181513] bg-[#181513] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#F7F5F0] shadow-xs">
                        <Star className="h-2.5 w-2.5 fill-[#B8860B] text-[#B8860B]" />
                        Hero
                      </span>
                    </div>
                  )}

                  {/* Image count pill */}
                  {product.images && product.images.length > 1 && (
                    <span className="absolute bottom-2.5 right-2.5 bg-[#181513]/70 px-2 py-0.5 text-[9px] text-[#F7F5F0] backdrop-blur-xs">
                      {product.images.length} photos
                    </span>
                  )}

                  {/* Status Indicator */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <button
                      type="button"
                      onClick={() => toggleProductStatus(product)}
                      disabled={busy}
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] backdrop-blur-xs transition ${
                        product.status === 'ACTIVE'
                          ? 'border-emerald-500/40 bg-emerald-50/90 text-emerald-900'
                          : product.status === 'DRAFT'
                          ? 'border-amber-500/40 bg-amber-50/90 text-amber-900'
                          : 'border-neutral-400/40 bg-neutral-100/90 text-neutral-700'
                      }`}
                      title="Click to toggle status"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          product.status === 'ACTIVE'
                            ? 'bg-emerald-600'
                            : product.status === 'DRAFT'
                            ? 'bg-amber-500'
                            : 'bg-neutral-400'
                        }`}
                      />
                      {product.status}
                    </button>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {/* Category Eyebrow */}
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#181513]/55">
                      <span>{product.category?.name || 'Uncategorized'}</span>
                      <span className="font-mono text-[#181513]/40">/{product.slug}</span>
                    </div>

                    {/* Product Name */}
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <h3 className="font-serif text-2xl font-normal leading-tight text-[#181513] transition group-hover:text-[#B8860B]">
                        {product.name}
                      </h3>
                      <Link
                        href={`/shop/${product.slug}`}
                        target="_blank"
                        className="mt-1 text-[#181513]/40 hover:text-[#B8860B]"
                        title="View on storefront"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {/* Description excerpt */}
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#181513]/65">
                        {product.description}
                      </p>
                    )}

                    {/* Storefront Placements */}
                    {placements.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {placements.map((pl) => (
                          <span
                            key={pl}
                            className={`border px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider ${
                              pl === 'HERO'
                                ? 'border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B] font-medium'
                                : 'border-[#E3DFD7] bg-[#F7F5F0] text-[#181513]/70'
                            }`}
                          >
                            {pl.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Stock footer */}
                  <div className="mt-5 border-t border-[#E3DFD7] pt-4">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-xl font-normal text-[#181513]">{priceRange}</span>
                        {hasDiscount && (
                          <span className="text-xs text-[#181513]/40 line-through">
                            ₹{(compareAt / 100).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      {discountPct && (
                        <span className="rounded-xs border border-[#B8860B]/30 bg-[#B8860B]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#B8860B]">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    {/* Inventory Health */}
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            totalStock > 10
                              ? 'bg-emerald-500'
                              : totalStock > 0
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className="text-[#181513]/75 font-medium">
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <span className="text-[#181513]/50">
                        {product.variants?.length || 0} format{product.variants?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#E3DFD7]/60 pt-3">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="flex items-center justify-center gap-1 bg-[#181513] px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
                        title="Open luxury workspace editor"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setVariantsProduct(product)}
                        className="flex items-center justify-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#181513] transition hover:border-[#181513]"
                        title="Configure formats and stock"
                      >
                        <Layers className="h-3 w-3" />
                        Formats
                      </button>

                      <button
                        type="button"
                        onClick={() => setImagesProduct(product)}
                        className="flex items-center justify-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#181513] transition hover:border-[#181513]"
                        title="Manage imagery"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Photos
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* EDITORIAL LEDGER TABLE VIEW */
        <div className="mt-6 overflow-x-auto border border-[#E3DFD7]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3DFD7] bg-[#ECE8E0]/40 text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                <th className="py-4 pl-4 pr-4 font-normal">Offering / Media</th>
                <th className="px-4 py-4 font-normal">Category</th>
                <th className="px-4 py-4 font-normal">Status</th>
                <th className="px-4 py-4 font-normal">Merchandising & Placements</th>
                <th className="px-4 py-4 font-normal">Pricing & Value</th>
                <th className="px-4 py-4 font-normal">Stock Health</th>
                <th className="py-4 pl-4 pr-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFD7]/60">
              {filteredProducts.map((product) => {
                const totalStock = product.variants?.reduce(
                  (sum, v) => sum + (v.quantityAvailable ?? v.availableStock ?? 0),
                  0
                ) ?? 0;
                const minPrice = product.variants?.length
                  ? Math.min(...product.variants.map((v) => v.priceCents))
                  : 0;
                const maxPrice = product.variants?.length
                  ? Math.max(...product.variants.map((v) => v.priceCents))
                  : 0;
                const priceRange =
                  minPrice === maxPrice
                    ? `₹${(minPrice / 100).toLocaleString('en-IN')}`
                    : `₹${(minPrice / 100).toLocaleString('en-IN')} – ₹${(maxPrice / 100).toLocaleString('en-IN')}`;

                const primaryImage = product.images?.[0]?.url;
                const badge = product.merchandising?.badge;
                const placements = product.merchandising?.placements || [];

                return (
                  <tr key={product.id} className="group transition-colors hover:bg-neutral-100/50">
                    {/* Offering / Media */}
                    <td className="py-4 pl-4 pr-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden border border-[#E3DFD7] bg-[#ECE8E0]">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.images?.[0]?.altText || product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[#181513]/30">
                              No pic
                            </div>
                          )}
                          {product.images?.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-[#181513]/70 px-1 text-[8px] text-[#F7F5F0]">
                              +{product.images.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-medium text-[#181513] group-hover:text-[#B8860B] transition-colors">
                              {product.name}
                            </span>
                            <Link
                              href={`/shop/${product.slug}`}
                              target="_blank"
                              className="text-[#181513]/40 hover:text-[#B8860B]"
                              title="View on storefront"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                          <span className="text-[10px] font-mono text-[#181513]/45 tracking-wider">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-[#181513]/75">
                      {product.category?.name ? (
                        <span className="border border-[#E3DFD7] px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-[#181513]/35">None</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(product)}
                        disabled={busy}
                        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition ${
                          product.status === 'ACTIVE'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : product.status === 'DRAFT'
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-600'
                              : product.status === 'DRAFT'
                              ? 'bg-amber-500'
                              : 'bg-neutral-400'
                          }`}
                        />
                        {product.status}
                      </button>
                    </td>

                    {/* Merchandising Badges & Placements */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {badge && (
                          <div>
                            <span className="inline-block border border-[#B8860B]/40 bg-[#B8860B]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#B8860B]">
                              {badge.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1">
                          {placements.map((pl) => (
                            <span
                              key={pl}
                              className={`border px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider ${
                                pl === 'HERO'
                                  ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]'
                                  : 'border-[#E3DFD7] text-[#181513]/70'
                              }`}
                            >
                              {pl === 'HERO' ? '★ Hero' : pl.replace('_', ' ')}
                            </span>
                          ))}
                          {placements.length === 0 && !badge && (
                            <span className="text-[10px] italic text-[#181513]/40">Default</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Pricing & Value */}
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-medium text-[#181513]">{priceRange}</span>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {product.variants?.map((v) => (
                            <span
                              key={v.id}
                              className={`border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                                v.status === 'ACTIVE'
                                  ? 'border-[#E3DFD7] text-[#181513]/75'
                                  : 'border-neutral-200 bg-neutral-100 text-[#181513]/40 line-through'
                              }`}
                              title={`${v.sku}: ₹${(v.priceCents / 100).toFixed(2)}${
                                v.compareAtPriceCents ? ` (MRP ₹${(v.compareAtPriceCents / 100).toFixed(2)})` : ''
                              }`}
                            >
                              {v.weightGrams}g · ₹{v.priceCents / 100}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Stock Health */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            totalStock > 10
                              ? 'bg-emerald-500'
                              : totalStock > 0
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium text-[#181513]">
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#181513]/50">
                        {product.variants?.length || 0} variant(s)
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setVariantsProduct(product)}
                          className="flex items-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#181513] transition hover:border-[#181513] hover:text-[#B8860B]"
                          title="Manage Variants, Pricing & Stock"
                        >
                          <Layers className="h-3 w-3" />
                          Formats
                        </button>

                        <button
                          type="button"
                          onClick={() => setImagesProduct(product)}
                          className="flex items-center gap-1 border border-[#E3DFD7] bg-[#F7F5F0] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#181513] transition hover:border-[#181513]"
                          title="Manage Images"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Photos
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          className="flex items-center gap-1 border border-[#181513] bg-[#181513] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
                          title="Open full editor workspace"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PRODUCT MODAL WIZARD */}
      {isCreateOpen && (
        <CreateProductModal
          categories={categories}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={async (newProduct) => {
            setIsCreateOpen(false);
            notify('success', `Product "${newProduct.name}" created and merchandised successfully.`);
            await loadData();
          }}
          onOpenCategoryCreator={() => setIsCategoryModalOpen(true)}
        />
      )}

      {/* LUXURY PRODUCT EDITOR WORKSPACE MODAL */}
      {editingProduct && (
        <ProductEditorModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSuccess={async (updated) => {
            setEditingProduct(null);
            notify('success', `Product "${updated.name}" updated successfully.`);
            await loadData();
          }}
          onOpenCategoryCreator={() => setIsCategoryModalOpen(true)}
          onOpenVariants={() => {
            setVariantsProduct(editingProduct);
          }}
          onOpenImages={() => {
            setImagesProduct(editingProduct);
          }}
        />
      )}

      {/* VARIANTS & STOCK MODAL */}
      {variantsProduct && (
        <ManageVariantsModal
          product={variantsProduct}
          onClose={() => setVariantsProduct(null)}
          onVariantUpdated={async () => {
            await loadData();
            const fresh = await fetchApi<ProductDto>(`/catalog/admin/products/${variantsProduct.id}`);
            if (fresh) setVariantsProduct(fresh);
          }}
          onAdjustStock={(variant) => {
            setStockVariant({ product: variantsProduct, variant });
          }}
        />
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {stockVariant && (
        <AdjustStockModal
          variant={stockVariant.variant}
          productName={stockVariant.product.name}
          onClose={() => setStockVariant(null)}
          onSuccess={async () => {
            setStockVariant(null);
            notify('success', `Inventory updated for SKU ${stockVariant.variant.sku}.`);
            await loadData();
            if (variantsProduct) {
              const fresh = await fetchApi<ProductDto>(`/catalog/admin/products/${variantsProduct.id}`);
              if (fresh) setVariantsProduct(fresh);
            }
          }}
        />
      )}

      {/* IMAGES MODAL */}
      {imagesProduct && (
        <ManageImagesModal
          product={imagesProduct}
          onClose={() => setImagesProduct(null)}
          onUpdated={async () => {
            await loadData();
            const fresh = await fetchApi<ProductDto>(`/catalog/admin/products/${imagesProduct.id}`);
            if (fresh) setImagesProduct(fresh);
          }}
        />
      )}

      {/* CATEGORY CREATOR MODAL */}
      {isCategoryModalOpen && (
        <QuickCategoryModal
          onClose={() => setIsCategoryModalOpen(false)}
          onSuccess={async (newCat) => {
            setIsCategoryModalOpen(false);
            notify('success', `Category "${newCat.name}" created.`);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// COMPREHENSIVE PRODUCT EDITOR WORKSPACE MODAL
// -------------------------------------------------------------
interface ProductEditorModalProps {
  product: ProductDto;
  categories: CategoryDto[];
  onClose: () => void;
  onSuccess: (updated: ProductDto) => void;
  onOpenCategoryCreator: () => void;
  onOpenVariants: () => void;
  onOpenImages: () => void;
}

function ProductEditorModal({
  product,
  categories,
  onClose,
  onSuccess,
  onOpenCategoryCreator,
  onOpenVariants,
  onOpenImages,
}: ProductEditorModalProps) {
  // Navigation section
  type EditorTab = 'basics' | 'pricing' | 'variants' | 'merchandising' | 'hero';
  const [activeTab, setActiveTab] = useState<EditorTab>('basics');

  // Section 1: Basics
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [categoryId, setCategoryId] = useState(product.category?.id || '');
  const [description, setDescription] = useState(product.description || '');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>(product.status);

  // Section 2 & 3: Primary Variant pricing & variant data
  const primaryVariant = product.variants?.[0];
  const [sellingPriceRupees, setSellingPriceRupees] = useState(
    primaryVariant ? (primaryVariant.priceCents / 100).toString() : '299'
  );
  const [compareAtPriceRupees, setCompareAtPriceRupees] = useState(
    primaryVariant?.compareAtPriceCents ? (primaryVariant.compareAtPriceCents / 100).toString() : ''
  );

  // Section 4: Merchandising
  const initialMerch = (product.merchandising || {}) as ProductMerchandising;
  const [badge, setBadge] = useState<MerchandisingLabel | ''>(initialMerch.badge || '');
  const [labels, setLabels] = useState<MerchandisingLabel[]>(initialMerch.labels || []);
  const [placements, setPlacements] = useState<MerchandisingPlacement[]>(initialMerch.placements || []);
  const [priority, setPriority] = useState<number>(initialMerch.priority || 0);

  // Section 5: Hero Configuration
  const initialHero = (initialMerch.hero || {}) as HeroConfiguration;
  const [heroHeadline, setHeroHeadline] = useState(initialHero.headline || '');
  const [heroSubheadline, setHeroSubheadline] = useState(initialHero.subheadline || '');
  const [heroCtaLabel, setHeroCtaLabel] = useState(initialHero.ctaLabel || 'Explore the collection');
  const [heroCtaDestination, setHeroCtaDestination] = useState(initialHero.ctaDestination || `/shop/${product.slug}`);
  const [heroDesktopImage, setHeroDesktopImage] = useState(initialHero.desktopImageUrl || product.images?.[0]?.url || '');
  const [heroMobileImage, setHeroMobileImage] = useState(initialHero.mobileImageUrl || '');
  const [heroPriority, setHeroPriority] = useState(initialHero.priority ?? 0);
  const [heroStartDate, setHeroStartDate] = useState(initialHero.startDate ? initialHero.startDate.slice(0, 10) : '');
  const [heroEndDate, setHeroEndDate] = useState(initialHero.endDate ? initialHero.endDate.slice(0, 10) : '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isHeroEnabled = placements.includes('HERO');

  // Discount calculation
  const discountCalc = useMemo(() => {
    const p = parseFloat(sellingPriceRupees);
    const mrp = parseFloat(compareAtPriceRupees);
    if (!isNaN(p) && !isNaN(mrp) && mrp > p && p > 0) {
      const savings = mrp - p;
      const pct = Math.round((savings / mrp) * 100);
      return { savings, pct };
    }
    return null;
  }, [sellingPriceRupees, compareAtPriceRupees]);

  function togglePlacement(p: MerchandisingPlacement) {
    setPlacements((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  }

  function toggleLabel(l: MerchandisingLabel) {
    setLabels((prev) =>
      prev.includes(l) ? prev.filter((item) => item !== l) : [...prev, l]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name cannot be empty.');
      return;
    }
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim())) {
      setError('Slug must consist of lowercase alphanumeric letters and hyphens only.');
      return;
    }

    setSaving(true);
    try {
      // Build merchandising payload
      const merchandisingPayload: ProductMerchandising = {
        badge: badge ? (badge as MerchandisingLabel) : undefined,
        labels,
        placements,
        priority: Number(priority) || 0,
        hero: isHeroEnabled
          ? {
              headline: heroHeadline.trim() || undefined,
              subheadline: heroSubheadline.trim() || undefined,
              ctaLabel: heroCtaLabel.trim() || undefined,
              ctaDestination: heroCtaDestination.trim() || undefined,
              desktopImageUrl: heroDesktopImage.trim() || undefined,
              mobileImageUrl: heroMobileImage.trim() || undefined,
              priority: Number(heroPriority) || 0,
              startDate: heroStartDate ? new Date(heroStartDate).toISOString() : undefined,
              endDate: heroEndDate ? new Date(heroEndDate).toISOString() : undefined,
            }
          : undefined,
      };

      // 1. Update Product
      const updated = await fetchApi<ProductDto>(`/catalog/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          categoryId: categoryId || undefined,
          description: description.trim(),
          status,
          merchandising: merchandisingPayload,
        }),
      });

      // 2. Update Primary Variant pricing if changed
      if (primaryVariant) {
        const pNum = parseFloat(sellingPriceRupees);
        if (!isNaN(pNum) && pNum > 0) {
          const priceCents = Math.round(pNum * 100);
          const compareAtPriceCents = compareAtPriceRupees
            ? Math.round(parseFloat(compareAtPriceRupees) * 100)
            : undefined;

          if (priceCents !== primaryVariant.priceCents || compareAtPriceCents !== primaryVariant.compareAtPriceCents) {
            await fetchApi(`/catalog/products/${product.id}/variants/${primaryVariant.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                priceCents,
                compareAtPriceCents,
              }),
            });
          }
        }
      }

      onSuccess(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product workspace.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/65 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col border border-[#E3DFD7] bg-[#F7F5F0] shadow-2xl">
        {/* Workspace Top Bar */}
        <div className="flex items-center justify-between border-b border-[#E3DFD7] px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#B8860B]" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Merchandising Workspace</span>
              <h2 className="font-serif text-2xl font-normal text-[#181513] md:text-3xl">{name || 'Edit Product'}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs border border-transparent p-1.5 text-[#181513]/50 transition hover:border-[#E3DFD7] hover:text-[#181513]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap border-b border-[#E3DFD7] bg-[#ECE8E0]/40 px-6 text-[10px] uppercase tracking-[0.18em] md:px-8">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === 'basics'
                ? 'border-[#B8860B] font-medium text-[#181513]'
                : 'border-transparent text-[#181513]/60 hover:text-[#181513]'
            }`}
          >
            1. Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === 'pricing'
                ? 'border-[#B8860B] font-medium text-[#181513]'
                : 'border-transparent text-[#181513]/60 hover:text-[#181513]'
            }`}
          >
            2. Pricing & Value
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === 'variants'
                ? 'border-[#B8860B] font-medium text-[#181513]'
                : 'border-transparent text-[#181513]/60 hover:text-[#181513]'
            }`}
          >
            3. Variants ({product.variants?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('merchandising')}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === 'merchandising'
                ? 'border-[#B8860B] font-medium text-[#181513]'
                : 'border-transparent text-[#181513]/60 hover:text-[#181513]'
            }`}
          >
            4. Merchandising Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`border-b-2 py-3 px-4 transition flex items-center gap-1.5 ${
              activeTab === 'hero'
                ? 'border-[#B8860B] font-medium text-[#181513]'
                : isHeroEnabled
                ? 'border-transparent text-[#B8860B] font-medium'
                : 'border-transparent text-[#181513]/40 hover:text-[#181513]'
            }`}
          >
            <Star className={`h-3 w-3 ${isHeroEnabled ? 'fill-[#B8860B] text-[#B8860B]' : ''}`} />
            5. Hero Spotlight {isHeroEnabled && '(Active)'}
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="product-editor-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === 'basics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full border border-[#E3DFD7] bg-white px-3.5 py-2.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">URL Slug *</label>
                      <button
                        type="button"
                        onClick={() => setIsSlugLocked(!isSlugLocked)}
                        className="text-[9px] uppercase tracking-[0.14em] text-[#B8860B] hover:underline"
                      >
                        {isSlugLocked ? 'Unlock to Edit' : 'Lock Slug'}
                      </button>
                    </div>
                    <div className="mt-1 flex items-center border border-[#E3DFD7] bg-white">
                      <span className="pl-3 text-[10px] font-mono text-[#181513]/40">/shop/</span>
                      <input
                        type="text"
                        required
                        disabled={isSlugLocked}
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full bg-transparent px-1 py-2.5 font-mono text-xs text-[#181513] focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Category *</label>
                      <button
                        type="button"
                        onClick={onOpenCategoryCreator}
                        className="text-[9px] uppercase tracking-[0.14em] text-[#B8860B] hover:underline"
                      >
                        + New Category
                      </button>
                    </div>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1 w-full border border-[#E3DFD7] bg-white px-3.5 py-2.5 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                      Publication Status *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 w-full border border-[#E3DFD7] bg-white px-3.5 py-2.5 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Visible on Storefront)</option>
                      <option value="DRAFT">DRAFT (Hidden / Preview)</option>
                      <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Product Description & Editorial Notes *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rich editorial prose describing the culinary heritage, aroma, flavour profile, and everyday uses..."
                    className="mt-1 w-full border border-[#E3DFD7] bg-white p-3.5 text-xs leading-relaxed text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>

                {/* Imagery Preview */}
                <div className="border-t border-[#E3DFD7] pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Product Imagery Gallery</h4>
                      <p className="text-[10px] text-[#181513]/55">Manage photography assets, primary cover photo, and gallery order.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenImages}
                      className="flex items-center gap-1.5 border border-[#181513] bg-[#181513] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Manage Photos
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    {product.images?.map((img, idx) => (
                      <div key={img.id || idx} className="relative aspect-[4/5] w-24 overflow-hidden border border-[#E3DFD7] bg-[#ECE8E0]">
                        <img src={img.url} alt={img.altText || product.name} className="h-full w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#181513]/85 p-0.5 text-center text-[8px] uppercase tracking-wider text-[#F7F5F0]">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                    {(!product.images || product.images.length === 0) && (
                      <div className="flex aspect-[4/5] w-24 items-center justify-center border border-dashed border-[#E3DFD7] text-center text-[10px] text-[#181513]/40">
                        No photos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & VALUE */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Default Format Pricing</h4>
                  <p className="text-[10px] text-[#181513]/55">
                    Configure the customer selling price and original MRP / compare-at price for the primary format.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                      Selling Price (₹) *
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#181513]/40">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={sellingPriceRupees}
                        onChange={(e) => setSellingPriceRupees(e.target.value)}
                        className="w-full border border-[#E3DFD7] bg-white py-2.5 pl-8 pr-3 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                      Original / MRP Price (₹) (Optional compare-at)
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#181513]/40">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={compareAtPriceRupees}
                        onChange={(e) => setCompareAtPriceRupees(e.target.value)}
                        placeholder="e.g. 350.00"
                        className="w-full border border-[#E3DFD7] bg-white py-2.5 pl-8 pr-3 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount calculation preview */}
                {discountCalc ? (
                  <div className="flex items-center gap-3 border border-[#B8860B]/40 bg-[#B8860B]/10 p-3.5 text-xs text-[#181513]">
                    <TrendingDown className="h-4 w-4 text-[#B8860B] shrink-0" />
                    <div>
                      <p className="font-medium">
                        Patron Savings:{' '}
                        <strong className="text-[#B8860B]">₹{discountCalc.savings.toFixed(2)}</strong> (
                        <span className="font-bold">{discountCalc.pct}% OFF</span>)
                      </p>
                      <p className="text-[10px] text-[#181513]/65">
                        Will be displayed on storefront cards and product detail pages with original price strikethrough.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-[#E3DFD7] bg-white p-3 text-[11px] text-[#181513]/55">
                    Standard pricing with no promotional discount active.
                  </div>
                )}

                {/* Variant Breakdown Matrix */}
                <div className="border-t border-[#E3DFD7] pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">All Variant Prices</h4>
                      <p className="text-[10px] text-[#181513]/55">Summary of prices across all configured packaging variants.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenVariants}
                      className="text-[10px] uppercase tracking-[0.16em] text-[#B8860B] hover:underline"
                    >
                      Manage All Formats →
                    </button>
                  </div>

                  <div className="mt-3 overflow-x-auto border border-[#E3DFD7]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#E3DFD7] bg-[#ECE8E0]/40 text-[9px] uppercase tracking-wider text-[#181513]/60">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Format</th>
                          <th className="p-2.5">Weight</th>
                          <th className="p-2.5">Price</th>
                          <th className="p-2.5">MRP</th>
                          <th className="p-2.5">Discount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3DFD7]">
                        {product.variants?.map((v) => {
                          const hasDisc = v.compareAtPriceCents && v.compareAtPriceCents > v.priceCents;
                          const disc = hasDisc
                            ? Math.round(((v.compareAtPriceCents! - v.priceCents) / v.compareAtPriceCents!) * 100)
                            : null;
                          return (
                            <tr key={v.id}>
                              <td className="p-2.5 font-mono text-[10px] text-[#181513]/70">{v.sku}</td>
                              <td className="p-2.5">{v.name}</td>
                              <td className="p-2.5">{v.weightGrams}g</td>
                              <td className="p-2.5 font-medium">₹{(v.priceCents / 100).toFixed(2)}</td>
                              <td className="p-2.5 text-[#181513]/50">
                                {v.compareAtPriceCents ? `₹${(v.compareAtPriceCents / 100).toFixed(2)}` : '—'}
                              </td>
                              <td className="p-2.5">
                                {disc ? (
                                  <span className="text-[#B8860B] font-semibold">{disc}% OFF</span>
                                ) : (
                                  <span className="text-[#181513]/35">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VARIANTS & INVENTORY */}
            {activeTab === 'variants' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Packaging Formats & Inventory</h4>
                    <p className="text-[10px] text-[#181513]/55">
                      Configure SKUs, weights, pouch/tin formats, and inventory allocations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenVariants}
                    className="flex items-center gap-1.5 border border-[#181513] bg-[#181513] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add or Edit Variant
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#E3DFD7]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E3DFD7] bg-[#ECE8E0]/40 text-[9px] uppercase tracking-wider text-[#181513]/60">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Format Name</th>
                        <th className="p-3">Weight</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock Available</th>
                        <th className="p-3">Reorder Alert</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3DFD7]">
                      {product.variants?.map((v) => {
                        const stock = v.quantityAvailable ?? v.availableStock ?? 0;
                        return (
                          <tr key={v.id}>
                            <td className="p-3 font-mono text-[10px] text-[#181513]/70">{v.sku}</td>
                            <td className="p-3 font-medium">{v.name}</td>
                            <td className="p-3">{v.weightGrams}g</td>
                            <td className="p-3 font-medium">₹{(v.priceCents / 100).toFixed(2)}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1.5 font-medium ${
                                  stock > 10 ? 'text-emerald-700' : stock > 0 ? 'text-amber-700' : 'text-red-700'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    stock > 10 ? 'bg-emerald-600' : stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                />
                                {stock} units
                              </span>
                            </td>
                            <td className="p-3 text-[#181513]/55">{v.reorderThreshold ?? 5} units</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                                  v.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(!product.variants || product.variants.length === 0) && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-xs text-[#181513]/50">
                            No variants configured yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: MERCHANDISING CONTROLS */}
            {activeTab === 'merchandising' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Primary Storefront Badge</h4>
                  <p className="text-[10px] text-[#181513]/55">
                    Select the single primary badge displayed as an editorial label across storefront cards.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setBadge('')}
                      className={`flex flex-col items-start border p-3 text-left transition ${
                        badge === ''
                          ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]'
                          : 'border-[#E3DFD7] bg-white text-[#181513] hover:border-[#181513]/50'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider">None</span>
                      <span className="mt-1 text-[9px] opacity-70">Standard listing</span>
                    </button>
                    {MERCHANDISING_BADGES.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => setBadge(b.value)}
                        className={`flex flex-col items-start border p-3 text-left transition ${
                          badge === b.value
                            ? 'border-[#B8860B] bg-[#B8860B]/10 ring-1 ring-[#B8860B]'
                            : 'border-[#E3DFD7] bg-white hover:border-[#181513]/50'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8860B]">
                          {b.label}
                        </span>
                        <span className="mt-1 text-[9px] text-[#181513]/60">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E3DFD7] pt-5">
                  <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Secondary Merchandising Labels</h4>
                  <p className="text-[10px] text-[#181513]/55">
                    Select additional merchandising tags used for catalog filtering and search highlights.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MERCHANDISING_BADGES.map((b) => {
                      const isSelected = labels.includes(b.value);
                      return (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => toggleLabel(b.value)}
                          className={`flex items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-wider transition ${
                            isSelected
                              ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]'
                              : 'border-[#E3DFD7] bg-white text-[#181513]/70 hover:border-[#181513]'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-[#B8860B]" />}
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#E3DFD7] pt-5">
                  <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">Storefront Placements</h4>
                  <p className="text-[10px] text-[#181513]/55">
                    Control which homepage and storefront curated sections this product appears in.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {HOMEPAGE_PLACEMENTS.map((pl) => {
                      const isChecked = placements.includes(pl.value);
                      return (
                        <div
                          key={pl.value}
                          onClick={() => togglePlacement(pl.value)}
                          className={`flex cursor-pointer items-start gap-3 border p-3.5 transition ${
                            isChecked
                              ? 'border-[#B8860B] bg-[#B8860B]/10'
                              : 'border-[#E3DFD7] bg-white hover:border-[#181513]/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => undefined} // Handled by parent div
                            className="mt-0.5 accent-[#B8860B]"
                          />
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#181513]">
                              {pl.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#181513]/60">{pl.desc}</p>
                            {pl.value === 'HERO' && isChecked && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setActiveTab('hero');
                                }}
                                className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-[#B8860B] underline"
                              >
                                Configure Hero Spotlight →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#E3DFD7] pt-5">
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Display Priority (Higher numbers appear earlier in curations)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-36 border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: HERO CONFIGURATION */}
            {activeTab === 'hero' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#E3DFD7] pb-4">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]">
                      Homepage Hero Spotlight Configuration
                    </h4>
                    <p className="text-[10px] text-[#181513]/55">
                      Fine-tune headline copy, call-to-actions, imagery, and campaign timing when featured on the homepage hero.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePlacement('HERO')}
                    className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${
                      isHeroEnabled
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-[#E3DFD7] bg-white text-[#181513]/60'
                    }`}
                  >
                    {isHeroEnabled ? '✓ Hero Enabled' : '+ Enable Hero Placement'}
                  </button>
                </div>

                {!isHeroEnabled ? (
                  <div className="border border-dashed border-[#E3DFD7] p-8 text-center">
                    <Star className="mx-auto h-8 w-8 text-[#B8860B]" />
                    <h5 className="mt-3 font-serif text-xl text-[#181513]">Hero Placement is Inactive</h5>
                    <p className="mt-1 text-xs text-[#181513]/60">
                      Enable &ldquo;Show in Hero&rdquo; to spotlight this product at the top of the Seethapaati storefront.
                    </p>
                    <button
                      type="button"
                      onClick={() => togglePlacement('HERO')}
                      className="mt-4 bg-[#181513] px-5 py-2 text-xs uppercase tracking-[0.16em] text-[#F7F5F0]"
                    >
                      Enable Hero Placement
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                        Hero Main Headline
                      </label>
                      <input
                        type="text"
                        value={heroHeadline}
                        onChange={(e) => setHeroHeadline(e.target.value)}
                        placeholder="e.g. Made for everyday moments."
                        className="mt-1 w-full border border-[#E3DFD7] bg-white px-3.5 py-2.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                        Hero Subheadline / Brand Intro
                      </label>
                      <textarea
                        rows={3}
                        value={heroSubheadline}
                        onChange={(e) => setHeroSubheadline(e.target.value)}
                        placeholder="e.g. Meet Seethapaati — a growing collection of familiar flavours and everyday favourites, made to find a place in your kitchen."
                        className="mt-1 w-full border border-[#E3DFD7] bg-white p-3.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          CTA Button Label
                        </label>
                        <input
                          type="text"
                          value={heroCtaLabel}
                          onChange={(e) => setHeroCtaLabel(e.target.value)}
                          placeholder="Explore the collection"
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          CTA Destination Route / URL
                        </label>
                        <input
                          type="text"
                          value={heroCtaDestination}
                          onChange={(e) => setHeroCtaDestination(e.target.value)}
                          placeholder="/shop or /shop/product-slug"
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 font-mono text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Hero Imagery */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          Hero Desktop Image URL
                        </label>
                        <input
                          type="text"
                          value={heroDesktopImage}
                          onChange={(e) => setHeroDesktopImage(e.target.value)}
                          placeholder="/images/masala.jpg or https://..."
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                        {/* Quick pick from curated assets */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-[#181513]/50">Quick pick:</span>
                          {CURATED_ASSETS.map((asset) => (
                            <button
                              key={asset.url}
                              type="button"
                              onClick={() => setHeroDesktopImage(asset.url)}
                              className="text-[9px] text-[#B8860B] hover:underline"
                            >
                              {asset.name.split('/')[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          Hero Mobile Image URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={heroMobileImage}
                          onChange={(e) => setHeroMobileImage(e.target.value)}
                          placeholder="Optional mobile asset..."
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Hero Priority & Scheduling */}
                    <div className="grid grid-cols-1 gap-4 border-t border-[#E3DFD7] pt-4 md:grid-cols-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          Hero Display Priority
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={heroPriority}
                          onChange={(e) => setHeroPriority(parseInt(e.target.value, 10) || 0)}
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          Campaign Start Date
                        </label>
                        <input
                          type="date"
                          value={heroStartDate}
                          onChange={(e) => setHeroStartDate(e.target.value)}
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                          Campaign End Date
                        </label>
                        <input
                          type="date"
                          value={heroEndDate}
                          onChange={(e) => setHeroEndDate(e.target.value)}
                          className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between border-t border-[#E3DFD7] bg-[#ECE8E0]/40 px-6 py-4 md:px-8">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#181513]/50">
            <span>Status: {status}</span>
            <span>·</span>
            <span>{placements.length} Storefront Placement(s)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#E3DFD7] bg-white px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#181513] transition hover:border-[#181513]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-editor-form"
              disabled={saving}
              className="bg-[#181513] px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
            >
              {saving ? 'Saving Workspace...' : 'Save Offering Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// POLISHED MULTI-STEP PRODUCT CREATION MODAL
// -------------------------------------------------------------
interface CreateProductModalProps {
  categories: CategoryDto[];
  onClose: () => void;
  onSuccess: (product: ProductDto) => void;
  onOpenCategoryCreator: () => void;
}

function CreateProductModal({ categories, onClose, onSuccess, onOpenCategoryCreator }: CreateProductModalProps) {
  // Wizard steps: 1: Basics, 2: Pricing & Variant, 3: Imagery, 4: Merchandising & Hero, 5: Review & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Basics
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('ACTIVE');

  // Step 2: Initial Variant & Pricing
  const [sku, setSku] = useState('');
  const [packType, setPackType] = useState('Pouch');
  const [weightGrams, setWeightGrams] = useState('250');
  const [priceRupees, setPriceRupees] = useState('299');
  const [compareAtPriceRupees, setCompareAtPriceRupees] = useState('');
  const [initialStock, setInitialStock] = useState('50');

  // Step 3: Imagery
  const [imageOption, setImageOption] = useState<'curated' | 'url' | 'none'>('curated');
  const [selectedCurated, setSelectedCurated] = useState(CURATED_ASSETS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Step 4: Merchandising & Placements
  const [badge, setBadge] = useState<MerchandisingLabel | ''>('NEW');
  const [placements, setPlacements] = useState<MerchandisingPlacement[]>(['FEATURED', 'NEW_ARRIVALS']);
  const [showInHero, setShowInHero] = useState(false);
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(val: string) {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);

    if (!sku) {
      const prefix = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4);
      if (prefix) setSku(`SP-${prefix}-250G`);
    }

    if (!heroHeadline) {
      setHeroHeadline(`${val} — Pure Culinary Tradition.`);
    }
  }

  function togglePlacement(p: MerchandisingPlacement) {
    setPlacements((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  }

  // Live discount computation
  const discountCalc = useMemo(() => {
    const p = parseFloat(priceRupees);
    const mrp = parseFloat(compareAtPriceRupees);
    if (!isNaN(p) && !isNaN(mrp) && mrp > p && p > 0) {
      const savings = mrp - p;
      const pct = Math.round((savings / mrp) * 100);
      return { savings, pct };
    }
    return null;
  }, [priceRupees, compareAtPriceRupees]);

  function validateCurrentStep(): boolean {
    setError('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Please provide a product offering name.');
        return false;
      }
      if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim())) {
        setError('URL slug must be valid lowercase alphanumeric characters and hyphens.');
        return false;
      }
      if (!categoryId) {
        setError('Please select a category for this offering.');
        return false;
      }
      if (!description.trim()) {
        setError('Please enter a description for the product.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!sku.trim()) {
        setError('SKU code is required for the initial format.');
        return false;
      }
      const p = parseFloat(priceRupees);
      if (isNaN(p) || p <= 0) {
        setError('Selling price must be greater than ₹0.');
        return false;
      }
      const w = parseInt(weightGrams, 10);
      if (isNaN(w) || w <= 0) {
        setError('Weight must be greater than 0 grams.');
        return false;
      }
      const st = parseInt(initialStock, 10);
      if (isNaN(st) || st < 0) {
        setError('Initial stock cannot be negative.');
        return false;
      }
      if (compareAtPriceRupees) {
        const mrp = parseFloat(compareAtPriceRupees);
        if (mrp < p) {
          setError('Original / MRP price cannot be lower than selling price.');
          return false;
        }
      }
    }
    return true;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5) as any);
    }
  }

  async function handleFinalSubmit() {
    setError('');
    setSaving(true);

    try {
      // 1. Compute Merchandising Placements
      const finalPlacements = [...placements];
      if (showInHero && !finalPlacements.includes('HERO')) {
        finalPlacements.push('HERO');
      }

      const merchandising: ProductMerchandising = {
        badge: badge ? (badge as MerchandisingLabel) : undefined,
        labels: badge ? [(badge as MerchandisingLabel)] : [],
        placements: finalPlacements,
        priority: 0,
        hero: showInHero
          ? {
              headline: heroHeadline.trim() || undefined,
              subheadline: heroSubheadline.trim() || undefined,
              ctaLabel: 'Explore the collection',
              ctaDestination: `/shop/${slug.trim()}`,
              desktopImageUrl:
                imageOption === 'curated'
                  ? selectedCurated
                  : imageOption === 'url'
                  ? customImageUrl.trim()
                  : undefined,
              priority: 0,
            }
          : undefined,
      };

      // 2. Create Product in DB
      const created = await fetchApi<ProductDto>('/catalog/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          categoryId,
          status,
          merchandising,
        }),
      });

      // 3. Attach Initial Variant
      if (created?.id) {
        const priceCents = Math.round(parseFloat(priceRupees) * 100);
        const compareAtPriceCents = compareAtPriceRupees
          ? Math.round(parseFloat(compareAtPriceRupees) * 100)
          : undefined;

        await fetchApi(`/catalog/products/${created.id}/variants`, {
          method: 'POST',
          body: JSON.stringify({
            sku: sku.trim().toUpperCase(),
            name: `${weightGrams}g ${packType}`,
            packType: packType.trim() || 'Pouch',
            weightGrams: parseInt(weightGrams, 10),
            priceCents,
            compareAtPriceCents,
            initialStock: parseInt(initialStock, 10) || 0,
          }),
        });
      }

      // 4. Attach Image
      if (created?.id) {
        const imageUrl =
          imageOption === 'curated'
            ? selectedCurated
            : imageOption === 'url'
            ? customImageUrl.trim()
            : null;

        if (imageUrl) {
          await fetchApi(`/catalog/products/${created.id}/images`, {
            method: 'POST',
            body: JSON.stringify({
              url: imageUrl,
              altText: `${name.trim()} packaging`,
              sortOrder: 0,
            }),
          });
        }
      }

      onSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/65 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col border border-[#E3DFD7] bg-[#F7F5F0] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E3DFD7] px-6 py-4 md:px-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">New Offering Experience</span>
            <h2 className="font-serif text-2xl font-normal text-[#181513] md:text-3xl">Create Product Offering</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#181513]/40 hover:text-[#181513]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="flex border-b border-[#E3DFD7] bg-[#ECE8E0]/40 px-6 py-2.5 text-[10px] uppercase tracking-[0.16em] md:px-8">
          {[
            { step: 1, title: 'Basics' },
            { step: 2, title: 'Pricing & Variant' },
            { step: 3, title: 'Imagery' },
            { step: 4, title: 'Merchandising' },
            { step: 5, title: 'Review & Publish' },
          ].map((s) => (
            <div
              key={s.step}
              className={`flex flex-1 items-center gap-1.5 ${
                currentStep === s.step
                  ? 'font-bold text-[#181513]'
                  : currentStep > s.step
                  ? 'text-[#B8860B]'
                  : 'text-[#181513]/35'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                  currentStep === s.step
                    ? 'bg-[#181513] text-[#F7F5F0]'
                    : currentStep > s.step
                    ? 'bg-[#B8860B] text-white'
                    : 'bg-neutral-300 text-neutral-600'
                }`}
              >
                {currentStep > s.step ? '✓' : s.step}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Ceylon Spiced Chai Blend"
                  className="mt-1 w-full border border-[#E3DFD7] bg-white px-3.5 py-2.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. ceylon-spiced-chai-blend"
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 font-mono text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Category *</label>
                    <button
                      type="button"
                      onClick={onOpenCategoryCreator}
                      className="text-[9px] uppercase tracking-[0.14em] text-[#B8860B] hover:underline"
                    >
                      + New Category
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs uppercase tracking-wider text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Status *</label>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="create-status"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                      className="accent-[#181513]"
                    />
                    <span>Active (Publish immediately to storefront)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="create-status"
                      checked={status === 'DRAFT'}
                      onChange={() => setStatus('DRAFT')}
                      className="accent-[#181513]"
                    />
                    <span>Draft (Private / internal preview only)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                  Product Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the aromatic spices, authentic traditional heritage, and serving recommendation..."
                  className="mt-1 w-full border border-[#E3DFD7] bg-white p-3 text-xs leading-relaxed text-[#181513] focus:border-[#B8860B] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PRICING & VARIANT */}
          {currentStep === 2 && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Initial SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="SP-TEA-250G"
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 font-mono text-xs uppercase text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Packaging Format</label>
                  <input
                    type="text"
                    value={packType}
                    onChange={(e) => setPackType(e.target.value)}
                    placeholder="Pouch / Tin / Glass Jar"
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">Net Weight (Grams) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Selling Price (₹) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#181513]/40">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(e.target.value)}
                      placeholder="299.00"
                      className="w-full border border-[#E3DFD7] bg-white py-2 pl-7 pr-3 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Original / MRP Price (₹)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#181513]/40">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={compareAtPriceRupees}
                      onChange={(e) => setCompareAtPriceRupees(e.target.value)}
                      placeholder="350.00"
                      className="w-full border border-[#E3DFD7] bg-white py-2 pl-7 pr-3 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Initial Stock Inventory *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>
              </div>

              {discountCalc && (
                <div className="flex items-center gap-2 border border-[#B8860B]/30 bg-[#B8860B]/10 p-2.5 text-xs text-[#181513]">
                  <TrendingDown className="h-4 w-4 text-[#B8860B]" />
                  <span>
                    Patron discount savings: <strong>₹{discountCalc.savings.toFixed(2)}</strong> (
                    <span className="text-[#B8860B] font-semibold">{discountCalc.pct}% OFF</span>)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: IMAGERY */}
          {currentStep === 3 && (
            <div className="space-y-5 text-xs">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="image-opt"
                    checked={imageOption === 'curated'}
                    onChange={() => setImageOption('curated')}
                    className="accent-[#181513]"
                  />
                  <span>Select Curated Brand Asset</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="image-opt"
                    checked={imageOption === 'url'}
                    onChange={() => setImageOption('url')}
                    className="accent-[#181513]"
                  />
                  <span>Custom URL / Asset Path</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="image-opt"
                    checked={imageOption === 'none'}
                    onChange={() => setImageOption('none')}
                    className="accent-[#181513]"
                  />
                  <span>Upload Photos Later</span>
                </label>
              </div>

              {imageOption === 'curated' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CURATED_ASSETS.map((asset) => (
                    <button
                      key={asset.url}
                      type="button"
                      onClick={() => setSelectedCurated(asset.url)}
                      className={`group relative aspect-[4/5] overflow-hidden border text-left transition ${
                        selectedCurated === asset.url
                          ? 'border-[#B8860B] ring-2 ring-[#B8860B]'
                          : 'border-[#E3DFD7] hover:border-[#181513]'
                      }`}
                    >
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-[#181513]/85 p-1 text-[8.5px] text-[#F7F5F0] truncate">
                        {asset.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {imageOption === 'url' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                    Product Image URL
                  </label>
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://... or /uploads/..."
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: MERCHANDISING & HERO */}
          {currentStep === 4 && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                  Primary Merchandising Badge
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setBadge('')}
                    className={`border p-2.5 text-left text-[10px] uppercase tracking-wider ${
                      badge === '' ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]' : 'border-[#E3DFD7] bg-white'
                    }`}
                  >
                    None
                  </button>
                  {MERCHANDISING_BADGES.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBadge(b.value)}
                      className={`border p-2.5 text-left text-[10px] uppercase tracking-wider ${
                        badge === b.value
                          ? 'border-[#B8860B] bg-[#B8860B]/10 font-bold text-[#B8860B]'
                          : 'border-[#E3DFD7] bg-white text-[#181513]/70'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[#181513]/60">
                  Homepage Placements
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HOMEPAGE_PLACEMENTS.map((pl) => {
                    const isChecked = placements.includes(pl.value);
                    return (
                      <label
                        key={pl.value}
                        className={`flex cursor-pointer items-center gap-2.5 border p-2.5 transition ${
                          isChecked ? 'border-[#B8860B] bg-[#B8860B]/10' : 'border-[#E3DFD7] bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePlacement(pl.value)}
                          className="accent-[#B8860B]"
                        />
                        <span className="text-[10px] uppercase tracking-wider">{pl.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#E3DFD7] pt-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showInHero}
                    onChange={(e) => setShowInHero(e.target.checked)}
                    className="accent-[#B8860B]"
                  />
                  <span>Spotlight this offering in the Homepage Hero Banner</span>
                </label>

                {showInHero && (
                  <div className="mt-3 space-y-3 rounded-xs border border-[#B8860B]/30 bg-[#B8860B]/5 p-3.5">
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.16em] text-[#181513]/60">
                        Hero Headline
                      </label>
                      <input
                        type="text"
                        value={heroHeadline}
                        onChange={(e) => setHeroHeadline(e.target.value)}
                        placeholder="e.g. Made for everyday moments."
                        className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-1.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.16em] text-[#181513]/60">
                        Hero Subheadline
                      </label>
                      <input
                        type="text"
                        value={heroSubheadline}
                        onChange={(e) => setHeroSubheadline(e.target.value)}
                        placeholder="e.g. A cherished spice blend crafted for everyday kitchens."
                        className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-1.5 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {currentStep === 5 && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Storefront Card Preview */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">
                    Live Storefront Preview
                  </h4>
                  <div className="mt-3 max-w-[280px] border border-[#E3DFD7] bg-[#F7F5F0] p-4 shadow-sm">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE8E0]">
                      <img
                        src={
                          imageOption === 'curated'
                            ? selectedCurated
                            : imageOption === 'url' && customImageUrl
                            ? customImageUrl
                            : '/images/masala.jpg'
                        }
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                      {badge && (
                        <span className="absolute left-3 top-3 border border-[#B8860B]/60 bg-[#F7F5F0]/95 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[#B8860B]">
                          {badge.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-[9px] uppercase tracking-wider text-[#181513]/50">
                        {categories.find((c) => c.id === categoryId)?.name || 'Category'}
                      </span>
                      <h5 className="font-serif text-lg leading-tight text-[#181513]">{name}</h5>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-medium">₹{priceRupees}</span>
                        {compareAtPriceRupees && (
                          <span className="text-xs text-[#181513]/40 line-through">₹{compareAtPriceRupees}</span>
                        )}
                        {discountCalc && (
                          <span className="text-[9px] text-[#B8860B] font-semibold">{discountCalc.pct}% OFF</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offering Summary Table */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Summary Overview</h4>
                  <div className="border border-[#E3DFD7] bg-white p-4 space-y-2.5">
                    <div className="flex justify-between border-b border-[#E3DFD7]/60 pb-2">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Name:</span>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E3DFD7]/60 pb-2">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Slug:</span>
                      <span className="font-mono text-[10px]">/shop/{slug}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E3DFD7]/60 pb-2">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Initial Format:</span>
                      <span>
                        {weightGrams}g {packType} ({sku})
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#E3DFD7]/60 pb-2">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Stock:</span>
                      <span className="font-medium text-emerald-700">{initialStock} units</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E3DFD7]/60 pb-2">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Badge:</span>
                      <span className="text-[#B8860B] font-semibold">{badge || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#181513]/50 uppercase text-[9.5px]">Placements:</span>
                      <span className="text-right">
                        {placements.length > 0 ? placements.join(', ') : 'Default catalogue only'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Wizard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-[#E3DFD7] bg-[#ECE8E0]/40 px-6 py-4 md:px-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1) as any)}
              className="flex items-center gap-1.5 border border-[#E3DFD7] bg-white px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-[#181513]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#E3DFD7] bg-white px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-[#181513]"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-[#181513] px-5 py-2 text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={saving}
                className="bg-[#181513] px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
              >
                {saving ? 'Creating Offering...' : '✓ Create & Publish Offering'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MANAGE VARIANTS & PRICING MODAL
// -------------------------------------------------------------
interface ManageVariantsModalProps {
  product: ProductDto;
  onClose: () => void;
  onVariantUpdated: () => void;
  onAdjustStock: (variant: ProductVariantDto) => void;
}

function ManageVariantsModal({ product, onClose, onVariantUpdated, onAdjustStock }: ManageVariantsModalProps) {
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantDto | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Add form
  const [sku, setSku] = useState(`SP-${product.slug.toUpperCase().slice(0, 5)}-`);
  const [name, setName] = useState('');
  const [packType, setPackType] = useState('Pouch');
  const [weightGrams, setWeightGrams] = useState('250');
  const [priceRupees, setPriceRupees] = useState('');
  const [compareAtPriceRupees, setCompareAtPriceRupees] = useState('');
  const [initialStock, setInitialStock] = useState('50');

  // Edit form
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editPackType, setEditPackType] = useState('');
  const [editWeightGrams, setEditWeightGrams] = useState('');
  const [editPriceRupees, setEditPriceRupees] = useState('');
  const [editCompareAtRupees, setEditCompareAtRupees] = useState('');
  const [editStatus, setEditStatus] = useState<any>('ACTIVE');

  function openEdit(v: ProductVariantDto) {
    setEditingVariant(v);
    setEditSku(v.sku);
    setEditName(v.name || '');
    setEditPackType(v.packType || 'Pouch');
    setEditWeightGrams(String(v.weightGrams));
    setEditPriceRupees((v.priceCents / 100).toString());
    setEditCompareAtRupees(v.compareAtPriceCents ? (v.compareAtPriceCents / 100).toString() : '');
    setEditStatus(v.status || 'ACTIVE');
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const p = parseFloat(priceRupees);
    if (isNaN(p) || p <= 0) {
      setError('Selling price must be greater than 0.');
      return;
    }
    const w = parseInt(weightGrams, 10);
    if (isNaN(w) || w <= 0) {
      setError('Weight must be greater than 0 grams.');
      return;
    }

    setBusy(true);
    try {
      const priceCents = Math.round(p * 100);
      const compareAtPriceCents = compareAtPriceRupees ? Math.round(parseFloat(compareAtPriceRupees) * 100) : undefined;

      await fetchApi(`/catalog/products/${product.id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          sku: sku.trim().toUpperCase(),
          name: name.trim() || `${weightGrams}g ${packType}`,
          packType: packType.trim() || 'Pouch',
          weightGrams: w,
          priceCents,
          compareAtPriceCents,
          initialStock: parseInt(initialStock, 10) || 0,
        }),
      });

      setIsAddingVariant(false);
      onVariantUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add variant.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVariant) return;
    setError('');

    const p = parseFloat(editPriceRupees);
    if (isNaN(p) || p <= 0) {
      setError('Selling price must be greater than 0.');
      return;
    }

    setBusy(true);
    try {
      const priceCents = Math.round(p * 100);
      const compareAtPriceCents = editCompareAtRupees ? Math.round(parseFloat(editCompareAtRupees) * 100) : undefined;

      await fetchApi(`/catalog/products/${product.id}/variants/${editingVariant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sku: editSku.trim().toUpperCase(),
          name: editName.trim(),
          packType: editPackType.trim() || 'Pouch',
          weightGrams: parseInt(editWeightGrams, 10),
          priceCents,
          compareAtPriceCents,
          status: editStatus,
        }),
      });

      setEditingVariant(null);
      onVariantUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-[#E3DFD7] bg-[#F7F5F0] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-[#E3DFD7] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8860B]">Packaging & Pricing</span>
            <h2 className="font-serif text-3xl font-normal text-[#181513]">{product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#181513]/40 hover:text-[#181513]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Variants Table */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]/60">Configured Formats</h3>
            {!isAddingVariant && !editingVariant && (
              <button
                type="button"
                onClick={() => setIsAddingVariant(true)}
                className="flex items-center gap-1 bg-[#181513] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0]"
              >
                <Plus className="h-3 w-3" />
                Add Format
              </button>
            )}
          </div>

          <div className="mt-3 overflow-x-auto border border-[#E3DFD7]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E3DFD7] bg-white text-[9px] uppercase tracking-wider text-[#181513]/50">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Name / Pack</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">MRP</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DFD7]">
                {product.variants?.map((v) => {
                  const stock = v.quantityAvailable ?? v.availableStock ?? 0;
                  return (
                    <tr key={v.id}>
                      <td className="p-3 font-mono text-[10px] text-[#181513]/70">{v.sku}</td>
                      <td className="p-3 font-medium">
                        {v.name}
                        <span className="block text-[9px] text-[#181513]/40">{v.packType}</span>
                      </td>
                      <td className="p-3">{v.weightGrams}g</td>
                      <td className="p-3 font-medium">₹{(v.priceCents / 100).toFixed(2)}</td>
                      <td className="p-3 text-[#181513]/50">
                        {v.compareAtPriceCents ? `₹${(v.compareAtPriceCents / 100).toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(v)}
                          className="font-medium text-[#B8860B] hover:underline"
                          title="Click to adjust stock"
                        >
                          {stock} in stock
                        </button>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                            v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="text-[10px] uppercase tracking-wider text-[#181513] hover:text-[#B8860B] underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Variant Form */}
        {isAddingVariant && (
          <form onSubmit={handleAddVariant} className="mt-6 border border-[#181513] bg-white p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E3DFD7] pb-3">
              <h4 className="font-serif text-lg font-medium text-[#181513]">Add New Packaging Format</h4>
              <button type="button" onClick={() => setIsAddingVariant(false)} className="text-[#181513]/40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">SKU Code *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Pack Type</label>
                <input
                  type="text"
                  value={packType}
                  onChange={(e) => setPackType(e.target.value)}
                  placeholder="Pouch / Tin / Jar"
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Weight (Grams) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">MRP Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={compareAtPriceRupees}
                  onChange={(e) => setCompareAtPriceRupees(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Initial Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingVariant(false)}
                className="border border-[#E3DFD7] px-4 py-2 text-[10px] uppercase tracking-[0.14em]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#181513] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0]"
              >
                {busy ? 'Saving...' : 'Add Format'}
              </button>
            </div>
          </form>
        )}

        {/* Edit Variant Form */}
        {editingVariant && (
          <form onSubmit={handleUpdateVariant} className="mt-6 border border-[#B8860B] bg-white p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E3DFD7] pb-3">
              <h4 className="font-serif text-lg font-medium text-[#181513]">Edit Format: {editingVariant.sku}</h4>
              <button type="button" onClick={() => setEditingVariant(null)} className="text-[#181513]/40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">SKU Code *</label>
                <input
                  type="text"
                  required
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value.toUpperCase())}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Format Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Pack Type</label>
                <input
                  type="text"
                  value={editPackType}
                  onChange={(e) => setEditPackType(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editPriceRupees}
                  onChange={(e) => setEditPriceRupees(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">MRP Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={editCompareAtRupees}
                  onChange={(e) => setEditCompareAtRupees(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full border border-[#E3DFD7] bg-[#F7F5F0] px-3 py-1.5 text-xs uppercase"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="border border-[#E3DFD7] px-4 py-2 text-[10px] uppercase tracking-[0.14em]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#181513] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0]"
              >
                {busy ? 'Saving...' : 'Save Format'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ADJUST STOCK MODAL
// -------------------------------------------------------------
interface AdjustStockModalProps {
  variant: ProductVariantDto;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AdjustStockModal({ variant, productName, onClose, onSuccess }: AdjustStockModalProps) {
  const [quantityAvailable, setQuantityAvailable] = useState(
    String(variant.quantityAvailable ?? variant.availableStock ?? 0)
  );
  const [reorderThreshold, setReorderThreshold] = useState(String(variant.reorderThreshold ?? 5));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantityAvailable, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Available quantity must be 0 or greater.');
      return;
    }

    const thresh = parseInt(reorderThreshold, 10);
    if (isNaN(thresh) || thresh < 0) {
      setError('Reorder threshold must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi(`/inventory/${variant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantityAvailable: qty,
          reorderThreshold: thresh,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust inventory stock.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md border border-[#E3DFD7] bg-[#F7F5F0] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-[#E3DFD7] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8860B]">Inventory Ledger</span>
            <h2 className="font-serif text-2xl font-normal text-[#181513]">Adjust Stock</h2>
            <p className="mt-1 text-xs text-[#181513]/60">
              {productName} · <span className="font-mono">{variant.sku}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#181513]/40 hover:text-[#181513]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">
              Current Available Units *
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantityAvailable}
              onChange={(e) => setQuantityAvailable(e.target.value)}
              className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">
              Low Stock Reorder Alert Threshold
            </label>
            <input
              type="number"
              min="0"
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(e.target.value)}
              className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E3DFD7] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#E3DFD7] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#181513]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#181513] px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MANAGE IMAGES MODAL
// -------------------------------------------------------------
interface ManageImagesModalProps {
  product: ProductDto;
  onClose: () => void;
  onUpdated: () => void;
}

function ManageImagesModal({ product, onClose, onUpdated }: ManageImagesModalProps) {
  const [tab, setTab] = useState<'curated' | 'upload' | 'url'>('curated');
  const [selectedCurated, setSelectedCurated] = useState(CURATED_ASSETS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [altText, setAltText] = useState(`${product.name} packaging view`);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      await fetchApi(`/catalog/products/${product.id}/images`, {
        method: 'POST',
        body: JSON.stringify({
          url: data.url,
          altText: altText.trim() || `${product.name} photo`,
          sortOrder: (product.images?.length || 0) + 1,
        }),
      });

      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAddImage(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const url = tab === 'curated' ? selectedCurated : customUrl.trim();
    if (!url) {
      setError('Please provide or select an image asset.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi(`/catalog/products/${product.id}/images`, {
        method: 'POST',
        body: JSON.stringify({
          url,
          altText: altText.trim() || `${product.name} photo`,
          sortOrder: (product.images?.length || 0) + 1,
        }),
      });

      setCustomUrl('');
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteImage(imageId?: string) {
    if (!imageId) return;
    try {
      await fetchApi(`/catalog/products/${product.id}/images/${imageId}`, {
        method: 'DELETE',
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#E3DFD7] bg-[#F7F5F0] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-[#E3DFD7] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8860B]">Visual Assets</span>
            <h2 className="font-serif text-3xl font-normal text-[#181513]">{product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#181513]/40 hover:text-[#181513]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing photos grid */}
        <div className="mt-6">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#181513]/60">Gallery Assets</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.images?.map((img, idx) => (
              <div key={img.id || idx} className="relative aspect-[4/5] overflow-hidden border border-[#E3DFD7] bg-[#ECE8E0]">
                <img src={img.url} alt={img.altText || product.name} className="h-full w-full object-cover" />
                <span className="absolute top-2 left-2 bg-[#181513]/80 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-[#F7F5F0]">
                  #{idx + 1} {idx === 0 ? '· Cover' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute bottom-2 right-2 rounded-xs bg-red-600/90 p-1.5 text-white transition hover:bg-red-700"
                  title="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(!product.images || product.images.length === 0) && (
              <div className="col-span-2 sm:col-span-4 border border-dashed border-[#E3DFD7] p-8 text-center text-xs text-[#181513]/50">
                No images attached to this offering yet.
              </div>
            )}
          </div>
        </div>

        {/* Add photo section */}
        <div className="mt-8 border-t border-[#E3DFD7] pt-6">
          <div className="flex border-b border-[#E3DFD7] text-[10px] uppercase tracking-[0.16em]">
            <button
              type="button"
              onClick={() => setTab('curated')}
              className={`border-b-2 py-2 px-4 ${
                tab === 'curated' ? 'border-[#181513] text-[#181513] font-medium' : 'border-transparent text-[#181513]/50'
              }`}
            >
              Curated Assets
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`border-b-2 py-2 px-4 ${
                tab === 'upload' ? 'border-[#181513] text-[#181513] font-medium' : 'border-transparent text-[#181513]/50'
              }`}
            >
              Upload Local File
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`border-b-2 py-2 px-4 ${
                tab === 'url' ? 'border-[#181513] text-[#181513] font-medium' : 'border-transparent text-[#181513]/50'
              }`}
            >
              External URL
            </button>
          </div>

          <div className="mt-4">
            {tab === 'curated' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CURATED_ASSETS.map((asset) => (
                    <button
                      key={asset.url}
                      type="button"
                      onClick={() => setSelectedCurated(asset.url)}
                      className={`group relative aspect-[4/5] overflow-hidden border text-left transition ${
                        selectedCurated === asset.url ? 'border-[#B8860B] ring-2 ring-[#B8860B]' : 'border-[#E3DFD7]'
                      }`}
                    >
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-[#181513]/85 p-1 text-[8.5px] text-[#F7F5F0] truncate">
                        {asset.name}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={saving}
                    className="bg-[#181513] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0]"
                  >
                    {saving ? 'Adding...' : 'Add Selected Asset'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'upload' && (
              <div className="rounded-xs border border-dashed border-[#E3DFD7] p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-[#181513]/30" />
                <label className="mt-4 inline-block cursor-pointer bg-[#181513] px-5 py-2 text-xs uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824]">
                  <span>{uploading ? 'Uploading...' : 'Choose File to Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-[10px] text-[#181513]/50">Accepts PNG, JPG, WEBP up to 5MB.</p>
              </div>
            )}

            {tab === 'url' && (
              <form onSubmit={handleAddImage} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Asset URL</label>
                  <input
                    type="text"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#181513] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0]"
                  >
                    {saving ? 'Adding...' : 'Add Photo URL'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// QUICK CATEGORY CREATOR MODAL
// -------------------------------------------------------------
interface QuickCategoryModalProps {
  onClose: () => void;
  onSuccess: (cat: CategoryDto) => void;
}

function QuickCategoryModal({ onClose, onSuccess }: QuickCategoryModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(val: string) {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Category slug is required.');
      return;
    }

    setSaving(true);
    try {
      const created = await fetchApi<CategoryDto>('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        }),
      });
      onSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181513]/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md border border-[#E3DFD7] bg-[#F7F5F0] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-[#E3DFD7] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8860B]">Catalogue Hierarchy</span>
            <h2 className="font-serif text-2xl font-normal text-[#181513]">Create Category</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#181513]/40 hover:text-[#181513]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Masalas & Blends"
              className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">URL Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. masalas-and-blends"
              className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 font-mono text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#181513]/60">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the category..."
              className="mt-1 w-full border border-[#E3DFD7] bg-white px-3 py-2 text-xs text-[#181513] focus:border-[#B8860B] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E3DFD7] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#E3DFD7] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#181513]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#181513] px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
