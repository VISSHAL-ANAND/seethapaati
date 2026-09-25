import { z } from 'zod';

// -------------------------------------------------------
// PRICING ENGINE OUTPUT CONTRACT
// -------------------------------------------------------

export const PricingLineItemSchema = z.object({
  variantId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  packType: z.string(),
  weightGrams: z.number().int(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative(),
});

export type PricingLineItem = z.infer<typeof PricingLineItemSchema>;

export const PricingBreakdownSchema = z.object({
  subtotalCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative().default(0),
  couponCode: z.string().optional(),
  couponDiscountCents: z.number().int().nonnegative().default(0),
  taxCents: z.number().int().nonnegative().default(0),
  shippingCents: z.number().int().nonnegative().default(0),
  freeShippingThresholdCents: z.number().int().nonnegative(),
  remainingForFreeShippingCents: z.number().int().nonnegative().default(0),
  grandTotalCents: z.number().int().nonnegative(),
  currency: z.string().default('INR'),
});

export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;

export const CartResponseSchema = z.object({
  cartId: z.string().uuid(),
  items: z.array(PricingLineItemSchema),
  pricing: PricingBreakdownSchema,
});

export type CartResponse = z.infer<typeof CartResponseSchema>;

// -------------------------------------------------------
// CART MUTATION REQUESTS
// -------------------------------------------------------

/** Max quantity per variant per cart — must match PricingService.MAX_QUANTITY_PER_VARIANT */
export const MAX_CART_QUANTITY_PER_VARIANT = 10;

export const AddCartItemRequestSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY_PER_VARIANT),
});

export type AddCartItemRequest = z.infer<typeof AddCartItemRequestSchema>;

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0).max(MAX_CART_QUANTITY_PER_VARIANT), // 0 = remove
});

export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;

export const ApplyCouponRequestSchema = z.object({
  code: z.string().trim().toUpperCase().min(1).max(50),
});

export type ApplyCouponRequest = z.infer<typeof ApplyCouponRequestSchema>;
