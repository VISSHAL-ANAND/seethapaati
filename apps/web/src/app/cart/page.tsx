'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Trash2, CheckCircle2, Truck } from 'lucide-react';
import type { CartResponse } from '@seethapaati/contracts';
import { fetchApi } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setCart(await fetchApi<CartResponse>('/cart'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your shopping bag.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setCart(null));
  }, []);

  async function update(variantId: string, quantity: number) {
    if (updating.includes(variantId)) return;
    setUpdating((c) => [...c, variantId]);
    setError('');
    try {
      const updatedCart = await fetchApi<CartResponse>('/cart/items/' + variantId, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      setCart(updatedCart);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this item. Please try again.');
    } finally {
      setUpdating((c) => c.filter((id) => id !== variantId));
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 bg-[#ECE8E0]" />
          <div className="h-px bg-[#E3DFD7]" />
          <div className="h-28 bg-[#ECE8E0]" />
          <div className="h-28 bg-[#ECE8E0]" />
        </div>
      </main>
    );
  }

  const items = cart?.items ?? [];
  const pricing = cart?.pricing;
  const threshold = pricing?.freeShippingThresholdCents ?? 0;
  const remaining = pricing?.remainingForFreeShippingCents ?? 0;
  const freeShippingUnlocked = remaining === 0;
  const progressPercent = threshold > 0 ? Math.min(100, Math.max(0, Math.round(((threshold - remaining) / threshold) * 100))) : 100;

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-16">
      {/* Editorial Header */}
      <header className="border-b border-[#E3DFD7] pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
              Your Selection
            </p>
            <h1 className="mt-3 font-serif text-5xl font-normal tracking-[-0.04em] text-[#181513] md:text-7xl">
              Shopping Bag
            </h1>
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#181513]/60">
            {items.reduce((sum, item) => sum + item.quantity, 0)} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-center justify-between border border-red-300 bg-red-50 p-4 text-xs text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load()}
            className="text-xs uppercase tracking-[0.14em] underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-24 text-center md:py-32">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECE8E0] text-[#181513]/40">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <p className="mt-6 font-serif text-3xl tracking-tight text-[#181513] md:text-4xl">
            Your shopping bag is empty.
          </p>
          <p className="mt-2 text-sm text-[#181513]/60">
            Discover considered pantry staples and seasonal delicacies crafted for your kitchen.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 bg-[#181513] px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
          >
            Explore the Collection
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-12 md:mt-12 md:grid-cols-[1fr_360px] lg:gap-16">
          {/* Items & Shipping Meter */}
          <div className="space-y-8">
            {/* Free Shipping Progress Meter */}
            {pricing && threshold > 0 && (
              <div className="border border-[#E3DFD7] bg-white/40 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#181513]">
                    <Truck className="h-4 w-4 text-[#B8860B]" />
                    {freeShippingUnlocked ? (
                      <span className="text-[#2E7D32]">
                        Complimentary delivery unlocked on this order!
                      </span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong className="font-semibold text-[#B8860B]">
                          ₹{(remaining / 100).toLocaleString('en-IN')}
                        </strong>{' '}
                        more to qualify for free shipping.
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#181513]/50">{progressPercent}%</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden bg-[#ECE8E0]">
                  <div
                    className="h-full bg-[#B8860B] transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Line Items List */}
            <div className="divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
              {items.map((item) => (
                <article
                  key={item.variantId}
                  className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h2 className="font-serif text-2xl text-[#181513]">{item.productName}</h2>
                    <p className="mt-1 text-xs text-[#181513]/60">
                      {item.packType} · {item.weightGrams}g · <span className="font-mono text-[11px] text-[#181513]/40">{item.sku}</span>
                    </p>
                    <p className="mt-1 text-xs text-[#181513]/70">
                      ₹{(item.unitPriceCents / 100).toLocaleString('en-IN')} each
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#E3DFD7] bg-white/50">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1 || updating.includes(item.variantId)}
                        onClick={() => update(item.variantId, item.quantity - 1)}
                        className="grid h-9 w-9 place-items-center text-sm text-[#181513] transition hover:bg-[#181513]/5 disabled:opacity-25"
                      >
                        −
                      </button>
                      <span className="grid h-9 min-w-9 place-items-center border-x border-[#E3DFD7] px-2 text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= 10 || updating.includes(item.variantId)}
                        onClick={() => update(item.variantId, item.quantity + 1)}
                        className="grid h-9 w-9 place-items-center text-sm text-[#181513] transition hover:bg-[#181513]/5 disabled:opacity-25"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={updating.includes(item.variantId)}
                      onClick={() => update(item.variantId, 0)}
                      className="text-xs text-[#181513]/45 transition hover:text-red-700 disabled:opacity-30"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <span className="min-w-24 text-right text-sm font-medium tabular-nums text-[#181513]">
                      ₹{(item.lineTotalCents / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#181513]/60 transition hover:text-[#181513]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue Exploring Offerings
              </Link>
            </div>
          </div>

          {/* Pricing Summary Aside */}
          {pricing && (
            <aside className="h-fit border-t border-[#181513] pt-6 md:sticky md:top-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[#181513]/60">
                Order Summary
              </p>

              <div className="mt-6 space-y-3.5 text-xs text-[#181513]">
                <div className="flex justify-between">
                  <span className="text-[#181513]/70">Subtotal</span>
                  <span className="tabular-nums font-medium">
                    ₹{(pricing.subtotalCents / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                {pricing.discountCents > 0 && (
                  <div className="flex justify-between text-[#B8860B]">
                    <span>Discount / Savings</span>
                    <span className="tabular-nums font-medium">
                      −₹{(pricing.discountCents / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#181513]/70">Estimated GST</span>
                  <span className="tabular-nums font-medium">
                    ₹{(pricing.taxCents / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#181513]/70">Shipping</span>
                  <span className="tabular-nums font-medium">
                    {pricing.shippingCents === 0 ? (
                      <span className="text-[#2E7D32]">Free</span>
                    ) : (
                      `₹${(pricing.shippingCents / 100).toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-between border-t border-[#E3DFD7] pt-5 font-serif text-2xl text-[#181513]">
                <span>Total</span>
                <span className="tabular-nums">
                  ₹{(pricing.grandTotalCents / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <Button
                className="mt-7 w-full"
                size="lg"
                onClick={() => {
                  window.location.href = '/checkout';
                }}
              >
                Proceed to Checkout
              </Button>

              <p className="mt-4 text-center text-[11px] text-[#181513]/50">
                Shipping and GST state code calculated at delivery step
              </p>
            </aside>
          )}
        </div>
      )}
    </main>
  );
}