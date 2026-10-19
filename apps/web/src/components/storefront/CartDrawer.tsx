'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ShoppingBag, Trash2, ArrowRight, Truck, Tag, Check, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    itemCount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    coupon,
    isLoading,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const items = cart?.items ?? [];
  const pricing = cart?.pricing;
  const threshold = pricing?.freeShippingThresholdCents ?? 50000;
  const remaining = pricing?.remainingForFreeShippingCents ?? 0;
  const isFreeShipping = remaining === 0;
  const progressPercent =
    threshold > 0 ? Math.min(100, Math.max(0, Math.round(((threshold - remaining) / threshold) * 100))) : 100;

  async function handleApplyPromo(code: string) {
    setCouponFeedback(null);
    const res = await applyCoupon(code);
    if (res.success) {
      setCouponFeedback({ isError: false, message: res.message || 'Promo applied!' });
      setInputCoupon('');
    } else {
      setCouponFeedback({ isError: true, message: res.message || 'Invalid promo code' });
    }
  }

  function handleCheckout() {
    closeDrawer();
    router.push('/checkout');
  }

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Bag Drawer">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#181513]/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 md:pl-10">
        <aside className="relative flex w-screen max-w-md flex-col bg-[#F7F5F0] shadow-2xl transition-transform duration-300 ease-out border-l border-[#E3DFD7]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E3DFD7] px-6 py-4.5 bg-[#F7F5F0]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-[#B8860B]" strokeWidth={1.75} />
              <h2 className="font-serif text-xl tracking-tight text-[#181513]">
                Your Shopping Bag
              </h2>
              {itemCount > 0 && (
                <span className="rounded-full bg-[#181513] px-2 py-0.5 text-[10px] font-semibold text-[#F7F5F0] tabular-nums">
                  {itemCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#E3DFD7] text-[#181513]/60 transition-colors hover:border-[#181513] hover:text-[#181513]"
              aria-label="Close bag"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          {items.length > 0 && (
            <div className="border-b border-[#E3DFD7] bg-[#EFECE6]/70 px-6 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-[#181513]">
                  <Truck className="h-3.5 w-3.5 text-[#B8860B]" />
                  {isFreeShipping ? (
                    <span className="text-[#2E7D32] font-semibold">
                      Complimentary Delivery Unlocked! ✳
                    </span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="text-[#B8860B]">
                        ₹{(remaining / 100).toLocaleString('en-IN')}
                      </strong>{' '}
                      for Free Delivery
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-[#181513]/50">{progressPercent}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E3DFD7]">
                <div
                  className="h-full bg-gradient-to-r from-[#B8860B] to-[#D7A63B] transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-16">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#EFECE6] text-[#181513]/35 mb-4">
                  <ShoppingBag className="h-8 w-8" strokeWidth={1.25} />
                </div>
                <p className="font-serif text-2xl text-[#181513]">Your bag is currently empty.</p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#181513]/60">
                  Discover heirloom spices, stone-ground powders, and nourishing malts crafted for everyday rituals.
                </p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="mt-6 inline-flex items-center gap-2 bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#F7F5F0] transition hover:bg-[#B8860B]"
                >
                  Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-[#E3DFD7]">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 pt-4 first:pt-0">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xs bg-[#EFECE6] border border-[#E3DFD7]">
                      <img
                        src="/images/masala.jpg"
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-base font-normal text-[#181513] leading-snug">
                            {item.productName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId || (item as any).id)}
                            className="p-1 text-[#181513]/40 hover:text-red-700 transition cursor-pointer"
                            title="Remove from bag"
                            aria-label={`Remove ${item.productName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#181513]/55">
                          {item.packType} {item.weightGrams ? `· ${item.weightGrams}g` : ''}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#E3DFD7] bg-white rounded-xs">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              item.quantity <= 1
                                ? removeItem(item.variantId || (item as any).id)
                                : updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="grid h-7 w-7 place-items-center text-xs text-[#181513] transition hover:bg-[#F7F5F0] cursor-pointer"
                            title={item.quantity <= 1 ? 'Remove from bag' : 'Decrease quantity'}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="grid h-7 min-w-7 place-items-center border-x border-[#E3DFD7] px-2 text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isLoading || item.quantity >= 10}
                            onClick={() => updateQuantity(item.variantId, Math.min(10, item.quantity + 1))}
                            className="grid h-7 w-7 place-items-center text-xs text-[#181513] transition hover:bg-[#F7F5F0] disabled:opacity-30 cursor-pointer"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-medium tabular-nums text-[#181513]">
                          ₹{(item.lineTotalCents / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Checkout Actions */}
          {items.length > 0 && (
            <div className="border-t border-[#E3DFD7] bg-[#EFECE6]/50 p-6 space-y-4">
              {/* Promo Code Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[#181513]/70">
                    <Tag className="h-3 w-3 text-[#B8860B]" />
                    Heirloom Promo Code
                  </span>
                  {pricing?.couponCode && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] text-red-700 underline underline-offset-2 hover:opacity-80 cursor-pointer"
                    >
                      Remove ({pricing.couponCode})
                    </button>
                  )}
                </div>

                {/* 1-Tap Coupon Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { code: 'SEETHA10', label: 'SEETHA10 (10% Off)' },
                    { code: 'WELCOME50', label: 'WELCOME50 (₹50 Off)' },
                  ].map((chip) => (
                    <button
                      key={chip.code}
                      type="button"
                      onClick={() => {
                        if (pricing?.couponCode === chip.code) {
                          removeCoupon();
                        } else {
                          handleApplyPromo(chip.code);
                        }
                      }}
                      className={`inline-flex items-center gap-1 border px-2.5 py-1 text-[10.5px] uppercase tracking-wider transition cursor-pointer ${
                        pricing?.couponCode === chip.code
                          ? 'border-[#B8860B] bg-[#B8860B] text-[#F7F5F0] font-semibold'
                          : 'border-[#B8860B]/40 bg-white/70 text-[#B8860B] hover:bg-[#B8860B]/10'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {chip.label}
                      {pricing?.couponCode === chip.code && <span className="ml-1 text-[10px]">✕</span>}
                    </button>
                  ))}
                </div>

                {/* Manual Promo Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                    placeholder="Have another coupon?"
                    className="flex-1 border border-[#E3DFD7] bg-white px-3 py-1.5 text-xs text-[#181513] placeholder:text-[#181513]/40 uppercase tracking-wider outline-none focus:border-[#B8860B]"
                  />
                  <button
                    type="button"
                    disabled={!inputCoupon.trim() || isLoading}
                    onClick={() => handleApplyPromo(inputCoupon)}
                    className="border border-[#181513] bg-[#181513] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[#F7F5F0] transition hover:bg-[#B8860B] hover:border-[#B8860B] disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>

                {couponFeedback && (
                  <p
                    className={`text-[11px] ${
                      couponFeedback.isError ? 'text-red-700' : 'text-[#2E7D32]'
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Pricing Totals */}
              {pricing && (
                <div className="space-y-1.5 border-t border-[#E3DFD7] pt-3 text-xs text-[#181513]">
                  <div className="flex justify-between">
                    <span className="text-[#181513]/60">Subtotal</span>
                    <span className="tabular-nums font-medium">
                      ₹{(pricing.subtotalCents / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {pricing.couponDiscountCents > 0 && (
                    <div className="flex justify-between text-[#B8860B] font-medium">
                      <span>Promo Savings ({pricing.couponCode})</span>
                      <span className="tabular-nums">
                        −₹{(pricing.couponDiscountCents / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#181513]/60">GST Tax (5%)</span>
                    <span className="tabular-nums font-medium">
                      ₹{(pricing.taxCents / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#181513]/60">Shipping</span>
                    <span className="tabular-nums font-medium">
                      {pricing.shippingCents === 0 ? (
                        <span className="text-[#2E7D32] font-semibold">FREE</span>
                      ) : (
                        `₹${(pricing.shippingCents / 100).toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#E3DFD7] pt-2 font-serif text-xl text-[#181513]">
                    <span>Total</span>
                    <span className="tabular-nums font-semibold">
                      ₹{(pricing.grandTotalCents / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-[#181513] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#B8860B] flex items-center justify-center gap-2 shadow-sm"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-[10.5px] text-[#181513]/50">
                Guaranteed Safe UPI & Card Checkout • Free Shipping Above ₹499
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
