import { z } from 'zod';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  VOID = 'VOID',
}

/**
 * Invoice Line Item Snapshot Schema (Immutable)
 */
export const InvoiceItemSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  productName: z.string().min(1),
  sku: z.string().min(1),
  hsnCode: z.string().min(4),
  uom: z.string().default('NOS'),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  taxableValueCents: z.number().int().nonnegative(),
  taxRatePercent: z.number().nonnegative(),
  cgstCents: z.number().int().nonnegative(),
  sgstCents: z.number().int().nonnegative(),
  igstCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative(),
  createdAt: z.string().datetime().optional(),
});

export type InvoiceItemSnapshot = z.infer<typeof InvoiceItemSnapshotSchema>;

/**
 * Full Immutable Tax Snapshot Document (Sealed JSON)
 */
export const InvoiceTaxSnapshotSchema = z.object({
  invoiceNumber: z.string(),
  orderNumber: z.string(),
  issuedAt: z.string().datetime(),
  seller: z.record(z.unknown()),
  buyer: z.record(z.unknown()),
  items: z.array(InvoiceItemSnapshotSchema),
  pricing: z.object({
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
    currency: z.string().default('INR'),
  }),
  clauses: z.object({
    reverseCharge: z.boolean().default(false),
    declaration: z.string(),
  }),
});

export type InvoiceTaxSnapshot = z.infer<typeof InvoiceTaxSnapshotSchema>;

/**
 * Complete Invoice DTO Schema
 */
export const InvoiceDtoSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  orderId: z.string().uuid(),
  status: z.nativeEnum(InvoiceStatus),
  currency: z.string().default('INR'),
  sellerSnapshot: z.record(z.unknown()),
  buyerSnapshot: z.record(z.unknown()),
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
  taxSnapshot: z.record(z.unknown()),
  issuedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  items: z.array(InvoiceItemSnapshotSchema).optional(),
});

export type InvoiceDto = z.infer<typeof InvoiceDtoSchema>;
