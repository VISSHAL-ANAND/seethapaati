'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import type { ProductDto } from '@seethapaati/contracts';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [variantId, setVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<'loading' | 'ready' | 'adding' | 'added' | 'error'>('loading');
  const [bagError, setBagError] = useState('');

  useEffect(() => {
    fetchApi<ProductDto>('/catalog/products/' + params.slug)
      .then((data) => {
        setProduct(data);
        const firstAvailable = data.variants.find((item) => item.isAvailable) ?? data.variants[0];
        setVariantId(firstAvailable?.id ?? '');
        setSelectedImageIndex(0);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [params.slug]);

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:py-32" aria-label="Loading product">
        <div className="grid animate-pulse gap-12 md:grid-cols-2 md:gap-20">
          <div className="aspect-[4/5] bg-[#ECE8E0]" />
          <div className="space-y-6 self-center">
            <div className="h-4 w-28 bg-[#ECE8E0]" />
            <div className="h-14 w-4/5 bg-[#ECE8E0]" />
            <div className="h-4 w-1/3 bg-[#ECE8E0]" />
            <div className="h-20 w-full bg-[#ECE8E0]" />
          </div>
        </div>
      </main>
    );
  }

  if (state === 'error' || !product) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
          Product Catalogue
        </p>
        <h1 className="mt-4 font-serif text-4xl text-[#181513] md:text-6xl">
          This piece is unavailable.
        </h1>
        <p className="mt-3 text-sm text-[#181513]/60">
          The requested delicacy may have been relocated, archived, or discontinued.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 border border-[#181513] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#181513] hover:bg-[#181513] hover:text-[#F7F5F0] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Collection
        </Link>
      </main>
    );
  }

  const selected = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const images = product.images.length > 0 ? product.images : [{ url: '/images/masala.jpg', altText: product.name }];
  const activeImage = images[selectedImageIndex] || images[0];

  const hasDiscount = Boolean(
    selected?.compareAtPriceCents && selected.compareAtPriceCents > selected.priceCents
  );
  const discountPercent = hasDiscount
    ? Math.round(((selected.compareAtPriceCents! - selected.priceCents) / selected.compareAtPriceCents!) * 100)
    : 0;

  async function addToBag() {
    if (!selected?.isAvailable) return;
    setBagError('');
    setState('adding');
    try {
      await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });
      setState('added');
    } catch (reason) {
      setBagError(reason instanceof Error ? reason.message : 'Unable to add this item. Please try again.');
      setState('ready');
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-24 pt-8 md:px-10 md:pb-32 md:pt-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#181513]/60 transition-colors hover:text-[#181513]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          The Collection
        </Link>
      </nav>

      {/* Main PDP Grid */}
      <div className="mt-8 grid items-start gap-12 md:mt-12 md:grid-cols-[1.08fr_0.92fr] md:gap-16 lg:gap-24">
        {/* Left Column: Visual Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE8E0] shadow-xs">
            {activeImage?.url ? (
              <img
                src={activeImage.url}
                alt={activeImage.altText || product.name}
                className="h-full w-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="flex h-full items-end p-10">
                <span className="font-serif text-6xl text-[#181513]/20">{product.name}</span>
              </div>
            )}

            {product.merchandising?.badge && (
              <span className="absolute left-4 top-4 border border-[#B8860B]/40 bg-[#F7F5F0]/95 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#B8860B] backdrop-blur-xs">
                {product.merchandising.badge.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#181513] opacity-100 ring-1 ring-[#181513]'
                      : 'border-[#E3DFD7] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Narrative & Purchasing */}
        <div className="pt-2 md:sticky md:top-12 md:pt-4">
          {product.category && (
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
              {product.category.name}
            </p>
          )}

          <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.04em] text-[#181513] md:text-6xl">
            {product.name}
          </h1>

          {/* Pricing & Stock Banner */}
          {selected && (
            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-medium tabular-nums text-[#181513] md:text-3xl">
                ₹{(selected.priceCents / 100).toLocaleString('en-IN')}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-base text-[#181513]/40 line-through tabular-nums">
                    ₹{(selected.compareAtPriceCents! / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="border border-[#B8860B]/40 bg-[#B8860B]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
                    {discountPercent}% OFF
                  </span>
                </>
              )}

              <span className="ml-auto text-xs font-medium uppercase tracking-[0.16em]">
                {selected.isAvailable ? (
                  <span className="text-[#2E7D32]">In Stock · Dispatch ready</span>
                ) : (
                  <span className="text-[#C62828]">Currently unavailable</span>
                )}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-6 border-t border-[#E3DFD7] pt-6">
              <p className="text-sm leading-relaxed text-[#181513]/70 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Variant Selection */}
          <div className="mt-8 space-y-6 border-t border-[#E3DFD7] pt-6">
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#181513]/60">
                <span>Select Format / Weight</span>
                {selected && (
                  <span className="text-[#181513]">
                    {selected.packType} {selected.weightGrams ? `(${selected.weightGrams}g)` : ''}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = variant.id === variantId;
                  const label = variant.name || variant.packType;
                  const weight = variant.weightGrams ? `${variant.weightGrams}g` : '';

                  return (
                    <button
                      type="button"
                      key={variant.id}
                      disabled={!variant.isAvailable}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setVariantId(variant.id);
                        setState('ready');
                        setBagError('');
                      }}
                      className={`flex flex-col items-start border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]'
                          : 'border-[#E3DFD7] bg-white/40 text-[#181513] hover:border-[#B8860B]'
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <span className="text-xs font-medium">
                        {label} {weight ? `· ${weight}` : ''}
                      </span>
                      <span
                        className={`mt-1 text-[11px] tabular-nums ${
                          isSelected ? 'text-[#F7F5F0]/80' : 'text-[#181513]/60'
                        }`}
                      >
                        ₹{(variant.priceCents / 100).toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <label htmlFor="quantity" className="text-xs uppercase tracking-[0.18em] text-[#181513]/60">
                Quantity
              </label>
              <div className="flex items-center border border-[#181513]/30 bg-white/40">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                  className="px-3.5 py-2 text-sm text-[#181513] transition hover:bg-[#181513]/5 disabled:opacity-30"
                >
                  −
                </button>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                  }
                  className="w-12 border-0 bg-transparent py-2 text-center text-xs font-medium outline-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity((v) => Math.min(10, v + 1))}
                  className="px-3.5 py-2 text-sm text-[#181513] transition hover:bg-[#181513]/5 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Bag Actions */}
          <div className="mt-8 space-y-4">
            <Button
              size="lg"
              onClick={addToBag}
              disabled={!selected?.isAvailable || state === 'adding'}
              isLoading={state === 'adding'}
              className="w-full"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {!selected?.isAvailable
                ? 'Currently Sold Out'
                : state === 'added'
                ? 'Added to Bag'
                : 'Add to Bag'}
            </Button>

            {bagError && (
              <p role="alert" className="border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-800">
                {bagError}
              </p>
            )}

            {state === 'added' && (
              <div className="flex items-center justify-between border border-[#B8860B]/40 bg-[#B8860B]/10 p-4 text-xs text-[#181513]">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B8860B]" />
                  <span>Item successfully added to your shopping bag.</span>
                </div>
                <Link
                  href="/cart"
                  className="font-medium text-[#A66B18] underline underline-offset-4 hover:text-[#181513]"
                >
                  View Bag →
                </Link>
              </div>
            )}
          </div>

          {/* Genuine Delicacy Specifications */}
          {selected && (
            <div className="mt-10 border-t border-[#E3DFD7] pt-6">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#181513]/60">
                Specifications
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-y border-[#E3DFD7] py-4 text-xs">
                <div>
                  <dt className="text-[#181513]/50">Packaging Format</dt>
                  <dd className="mt-0.5 font-medium text-[#181513]">{selected.packType}</dd>
                </div>
                <div>
                  <dt className="text-[#181513]/50">Net Quantity</dt>
                  <dd className="mt-0.5 font-medium text-[#181513]">
                    {selected.weightGrams ? `${selected.weightGrams}g` : 'Standard pack'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#181513]/50">SKU Reference</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-[#181513]">{selected.sku}</dd>
                </div>
                <div>
                  <dt className="text-[#181513]/50">Category</dt>
                  <dd className="mt-0.5 font-medium text-[#181513]">
                    {product.category?.name || 'Pantry'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
