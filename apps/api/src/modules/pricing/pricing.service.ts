import { Injectable, Logger } from '@nestjs/common';
import { PricingBreakdown, PricingLineItem } from '@seethapaati/contracts';

/**
 * PRICING ENGINE - Server Authoritative
 *
 * Pipeline:
 *   base unit prices
 *     → line totals
 *       → subtotal
 *         → coupon discount
 *           → tax (GST 5%)
 *             → shipping (free above threshold)
 *               → grand total
 *
 * Client never supplies prices. This service is the single source of truth.
 */

// Business constants — could be moved to DB config table in Phase 5
const GST_RATE = 0.05; // 5% GST on food items
const FREE_SHIPPING_THRESHOLD_CENTS = 50000; // ₹500 = free shipping
const STANDARD_SHIPPING_CENTS = 5000; // ₹50 flat shipping
const MAX_QUANTITY_PER_VARIANT = 10;

export interface CartItemInput {
  variantId: string;
  productName: string;
  sku: string;
  packType: string;
  weightGrams: number;
  quantity: number;
  unitPriceCents: number; // Fetched from DB — never from client
}

export interface CouponInput {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number; // percentage (e.g. 10 = 10%) or fixed cents
  minOrderCents: number;
  maxDiscountCents: number | null;
}

export interface PricingResult {
  lineItems: PricingLineItem[];
  breakdown: PricingBreakdown;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  calculate(items: CartItemInput[], coupon?: CouponInput | null, taxRatesByVariant?: Map<string, number>): PricingResult {
    if (items.length === 0) {
      return this.emptyResult();
    }

    // 1. Compute line items
    const lineItems: PricingLineItem[] = items.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      packType: item.packType,
      weightGrams: item.weightGrams,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.unitPriceCents * item.quantity,
    }));

    // 2. Subtotal
    const subtotalCents = lineItems.reduce((sum, li) => sum + li.lineTotalCents, 0);

    // 3. Coupon discount
    let couponDiscountCents = 0;
    let couponCode: string | undefined;

    if (coupon && subtotalCents >= coupon.minOrderCents) {
      couponCode = coupon.code;
      if (coupon.discountType === 'PERCENTAGE') {
        couponDiscountCents = Math.round((subtotalCents * coupon.discountValue) / 100);
      } else {
        couponDiscountCents = coupon.discountValue;
      }

      // Cap at maximum discount if set
      if (coupon.maxDiscountCents !== null && couponDiscountCents > coupon.maxDiscountCents) {
        couponDiscountCents = coupon.maxDiscountCents;
      }

      // Discount cannot exceed subtotal
      couponDiscountCents = Math.min(couponDiscountCents, subtotalCents);
    }

    const afterDiscount = subtotalCents - couponDiscountCents;

    // 4. Tax is normally supplied from the authoritative HSN configuration.
    // Legacy default remains only for callers that do not provide tax configuration.
    const taxCents = taxRatesByVariant && taxRatesByVariant.size > 0
      ? this.calculateConfiguredTax(lineItems, couponDiscountCents, taxRatesByVariant)
      : Math.round(afterDiscount * GST_RATE);

    // 5. Shipping
    const shippingCents = afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
    const remainingForFreeShippingCents = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - afterDiscount);

    // 6. Grand total
    const grandTotalCents = afterDiscount + taxCents + shippingCents;

    const breakdown: PricingBreakdown = {
      subtotalCents,
      discountCents: 0, // Product-level discounts (compareAtPrice) — Phase 3
      couponCode,
      couponDiscountCents,
      taxCents,
      shippingCents,
      freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
      remainingForFreeShippingCents,
      grandTotalCents,
      currency: 'INR',
    };

    return { lineItems, breakdown };
  }

  private calculateConfiguredTax(lineItems: PricingLineItem[], discountCents: number, rates: Map<string, number>): number {
    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotalCents, 0);
    if (subtotal <= 0) return 0;
    const allocations = lineItems.map((li) => Math.floor((discountCents * li.lineTotalCents) / subtotal));
    let remainder = discountCents - allocations.reduce((a, b) => a + b, 0);
    for (let i = 0; remainder > 0; i = (i + 1) % allocations.length) { allocations[i]++; remainder--; }
    return lineItems.reduce((sum, li, i) => {
      const taxable = li.lineTotalCents - allocations[i];
      const rate = rates.get(li.variantId);
      if (rate === undefined) throw new Error('TAX_CONFIGURATION_MISSING');
      return sum + Math.round((taxable * rate) / 100);
    }, 0);
  }

  private emptyResult(): PricingResult {
    return {
      lineItems: [],
      breakdown: {
        subtotalCents: 0,
        discountCents: 0,
        couponDiscountCents: 0,
        taxCents: 0,
        shippingCents: 0,
        freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
        remainingForFreeShippingCents: FREE_SHIPPING_THRESHOLD_CENTS,
        grandTotalCents: 0,
        currency: 'INR',
      },
    };
  }

  getMaxQuantityPerVariant(): number {
    return MAX_QUANTITY_PER_VARIANT;
  }
}
