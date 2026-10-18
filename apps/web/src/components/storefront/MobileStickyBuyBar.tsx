'use client';

import React from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import type { ProductVariantDto } from '@seethapaati/contracts';

interface MobileStickyBuyBarProps {
  productName: string;
  selectedVariant: ProductVariantDto | undefined;
  onAddToCart: () => void;
  isAdding: boolean;
  isAdded: boolean;
}

export function MobileStickyBuyBar({
  productName,
  selectedVariant,
  onAddToCart,
  isAdding,
  isAdded,
}: MobileStickyBuyBarProps) {
  if (!selectedVariant) return null;

  const isAvailable = selectedVariant.isAvailable;
  const hasDiscount = Boolean(
    selectedVariant.compareAtPriceCents &&
      selectedVariant.compareAtPriceCents > selectedVariant.priceCents
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E3DFD7] bg-[#F7F5F0]/95 backdrop-blur-md px-4 py-3 md:hidden shadow-[0_-4px_25px_rgba(24,21,19,0.08)]"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Price & Variant Information */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase tracking-wider text-[#181513]/60">
            {selectedVariant.packType} {selectedVariant.weightGrams ? `(${selectedVariant.weightGrams}g)` : ''}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-normal tabular-nums text-[#181513]">
              ₹{(selectedVariant.priceCents / 100).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#181513]/40 line-through tabular-nums">
                ₹{(selectedVariant.compareAtPriceCents! / 100).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          disabled={!isAvailable || isAdding}
          onClick={onAddToCart}
          className={`flex h-12 flex-1 items-center justify-center gap-2 px-4 text-xs font-semibold uppercase tracking-[0.16em] transition-all rounded-xs ${
            !isAvailable
              ? 'bg-[#EFECE6] text-[#181513]/40 cursor-not-allowed'
              : isAdded
              ? 'bg-[#B8860B] text-[#F7F5F0]'
              : 'bg-[#181513] text-[#F7F5F0] hover:bg-[#B8860B] active:scale-[0.98]'
          }`}
        >
          {isAdding ? (
            <span className="animate-pulse">Adding…</span>
          ) : isAdded ? (
            <>
              <Check className="h-4 w-4" /> Added to Bag
            </>
          ) : !isAvailable ? (
            'Sold Out'
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add to Bag
            </>
          )}
        </button>
      </div>
    </div>
  );
}
