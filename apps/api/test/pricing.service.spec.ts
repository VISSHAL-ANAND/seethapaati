import { PricingService, CartItemInput, CouponInput } from '../src/modules/pricing/pricing.service';

describe('PricingService - Server-Authoritative Commerce Calculations', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  const baseItem1: CartItemInput = {
    variantId: '11111111-1111-1111-1111-111111111111',
    productName: 'Organic Turmeric Powder',
    sku: 'TURM-250G',
    packType: 'Pouch',
    weightGrams: 250,
    quantity: 2,
    unitPriceCents: 15000, // ₹150.00
  };

  const baseItem2: CartItemInput = {
    variantId: '22222222-2222-2222-2222-222222222222',
    productName: 'Stone Ground Sambar Powder',
    sku: 'SAMB-500G',
    packType: 'Jar',
    weightGrams: 500,
    quantity: 1,
    unitPriceCents: 25000, // ₹250.00
  };

  const taxRates = new Map<string, number>([
    [baseItem1.variantId, 5],
    [baseItem2.variantId, 5],
  ]);

  it('calculates empty cart correctly with zero totals and threshold remaining', () => {
    const result = pricingService.calculate([]);

    expect(result.lineItems).toEqual([]);
    expect(result.breakdown.subtotalCents).toBe(0);
    expect(result.breakdown.discountCents).toBe(0);
    expect(result.breakdown.couponDiscountCents).toBe(0);
    expect(result.breakdown.taxCents).toBe(0);
    expect(result.breakdown.shippingCents).toBe(0);
    expect(result.breakdown.freeShippingThresholdCents).toBe(50000);
    expect(result.breakdown.remainingForFreeShippingCents).toBe(50000);
    expect(result.breakdown.grandTotalCents).toBe(0);
    expect(result.breakdown.currency).toBe('INR');
  });

  it('calculates line item totals, 5% GST, and standard shipping below ₹500 threshold', () => {
    // Subtotal: 2 * 15000 = 30000 paise (₹300.00)
    // Below ₹500 (50000 paise) threshold -> standard shipping 5000 paise (₹50.00)
    // 5% GST: 30000 * 0.05 = 1500 paise (₹15.00)
    // Grand total: 30000 + 1500 + 5000 = 36500 paise (₹365.00)
    const result = pricingService.calculate([baseItem1], null, taxRates);

    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].lineTotalCents).toBe(30000);
    expect(result.breakdown.subtotalCents).toBe(30000);
    expect(result.breakdown.shippingCents).toBe(5000);
    expect(result.breakdown.remainingForFreeShippingCents).toBe(20000);
    expect(result.breakdown.taxCents).toBe(1500);
    expect(result.breakdown.grandTotalCents).toBe(36500);
  });

  it('applies free shipping when order reaches or exceeds ₹500 (50000 paise)', () => {
    // Subtotal: (2 * 15000) + (1 * 25000) = 55000 paise (₹550.00)
    // Free shipping threshold reached -> shipping 0
    // 5% GST: 55000 * 0.05 = 2750 paise (₹27.50)
    // Grand total: 55000 + 2750 + 0 = 57750 paise (₹577.50)
    const result = pricingService.calculate([baseItem1, baseItem2], null, taxRates);

    expect(result.breakdown.subtotalCents).toBe(55000);
    expect(result.breakdown.shippingCents).toBe(0);
    expect(result.breakdown.remainingForFreeShippingCents).toBe(0);
    expect(result.breakdown.taxCents).toBe(2750);
    expect(result.breakdown.grandTotalCents).toBe(57750);
  });

  it('applies percentage coupon discount with maximum cap and calculates post-discount GST', () => {
    // Subtotal: 55000 paise
    // Coupon: 20% off, max discount 5000 paise (₹50.00)
    // 20% of 55000 is 11000, capped at 5000
    // After discount: 55000 - 5000 = 50000 paise
    // GST (5% on 50000): 2500 paise
    // After discount is >= 50000 -> Free shipping (0)
    // Grand total: 50000 + 2500 + 0 = 52500 paise
    const coupon: CouponInput = {
      code: 'FESTIVE20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderCents: 30000,
      maxDiscountCents: 5000,
    };

    const result = pricingService.calculate([baseItem1, baseItem2], coupon, taxRates);

    expect(result.breakdown.couponCode).toBe('FESTIVE20');
    expect(result.breakdown.couponDiscountCents).toBe(5000);
    expect(result.breakdown.taxCents).toBe(2500);
    expect(result.breakdown.shippingCents).toBe(0);
    expect(result.breakdown.grandTotalCents).toBe(52500);
  });

  it('applies fixed coupon discount correctly', () => {
    // Subtotal: 30000 paise (₹300)
    // Coupon: Fixed 5000 paise (₹50)
    // After discount: 25000 paise (₹250)
    // Below ₹500 threshold -> Shipping 5000 paise (₹50)
    // 5% GST on 25000: 1250 paise
    // Grand total: 25000 + 1250 + 5000 = 31250 paise
    const coupon: CouponInput = {
      code: 'SAVE50',
      discountType: 'FIXED',
      discountValue: 5000,
      minOrderCents: 20000,
      maxDiscountCents: null,
    };

    const result = pricingService.calculate([baseItem1], coupon, taxRates);

    expect(result.breakdown.couponCode).toBe('SAVE50');
    expect(result.breakdown.couponDiscountCents).toBe(5000);
    expect(result.breakdown.taxCents).toBe(1250);
    expect(result.breakdown.shippingCents).toBe(5000);
    expect(result.breakdown.grandTotalCents).toBe(31250);
  });

  it('does not apply coupon if subtotal is below minOrderCents', () => {
    const coupon: CouponInput = {
      code: 'BIGSAVER',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderCents: 100000, // ₹1000 minimum
      maxDiscountCents: null,
    };

    const result = pricingService.calculate([baseItem1], coupon);

    expect(result.breakdown.couponCode).toBeUndefined();
    expect(result.breakdown.couponDiscountCents).toBe(0);
    expect(result.breakdown.subtotalCents).toBe(30000);
  });

  it('rejects non-empty pricing without authoritative tax configuration', () => {
    expect(() => pricingService.calculate([baseItem1])).toThrow('TAX_CONFIGURATION_MISSING');
  });

  it('provides MAX_QUANTITY_PER_VARIANT matching constant 10', () => {
    expect(pricingService.getMaxQuantityPerVariant()).toBe(10);
  });
});
