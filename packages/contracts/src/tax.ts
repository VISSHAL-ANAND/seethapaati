import { z } from 'zod';

/**
 * Tax Rate Data Transfer Schema
 */
export const TaxRateDtoSchema = z.object({
  id: z.string().uuid().optional(),
  hsnCode: z.string().min(4).max(8),
  description: z.string().nullable().optional(),
  taxRatePercent: z.number().nonnegative(),
  isActive: z.boolean().default(true),
});

export type TaxRateDto = z.infer<typeof TaxRateDtoSchema>;

/**
 * Seller Address and Tax Profile Schema
 */
export const SellerTaxConfigSchema = z.object({
  legalName: z.string().min(1),
  tradeName: z.string().min(1),
  gstin: z.string().min(15).max(15),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    stateCode: z.string().length(2),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  stateCode: z.string().length(2),
  stateName: z.string().min(1),
});

export type SellerTaxConfig = z.infer<typeof SellerTaxConfigSchema>;

/**
 * Buyer Location for Tax Allocation
 */
export const BuyerTaxLocationSchema = z.object({
  state: z.string().min(1),
  stateCode: z.string().length(2),
  gstin: z.string().length(15).optional().nullable(),
});

export type BuyerTaxLocation = z.infer<typeof BuyerTaxLocationSchema>;

/**
 * Calculated Tax Breakdown per line item
 */
export const LineItemTaxBreakdownSchema = z.object({
  variantId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  hsnCode: z.string(),
  uom: z.string().default('NOS'),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  taxableValueCents: z.number().int().nonnegative(),
  taxRatePercent: z.number().nonnegative(),
  isIntraState: z.boolean(),
  cgstRatePercent: z.number().nonnegative(),
  cgstCents: z.number().int().nonnegative(),
  sgstRatePercent: z.number().nonnegative(),
  sgstCents: z.number().int().nonnegative(),
  igstRatePercent: z.number().nonnegative(),
  igstCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative(),
});

export type LineItemTaxBreakdown = z.infer<typeof LineItemTaxBreakdownSchema>;

/**
 * Aggregate Tax Calculation Result
 */
export const TaxCalculationResultSchema = z.object({
  isIntraState: z.boolean(),
  sellerStateCode: z.string().length(2),
  buyerStateCode: z.string().length(2),
  items: z.array(LineItemTaxBreakdownSchema),
  taxableSubtotalCents: z.number().int().nonnegative(),
  cgstCents: z.number().int().nonnegative(),
  sgstCents: z.number().int().nonnegative(),
  igstCents: z.number().int().nonnegative(),
  totalTaxCents: z.number().int().nonnegative(),
  shippingNetCents: z.number().int().nonnegative(),
  shippingTaxCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative(),
  roundOffCents: z.number().int(),
  grandTotalCents: z.number().int().nonnegative(),
});

export type TaxCalculationResult = z.infer<typeof TaxCalculationResultSchema>;
