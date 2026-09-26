import { z } from 'zod';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
}

export const OrderItemSnapshotSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  packType: z.string(),
  weightGrams: z.number(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  taxCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative(),
});

export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;

export const OrderDtoSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.nativeEnum(OrderStatus),
  createdAt: z.string().datetime(),
  items: z.array(OrderItemSnapshotSchema),
  pricing: z.object({
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    taxCents: z.number().int().nonnegative(),
    shippingCents: z.number().int().nonnegative(),
    grandTotalCents: z.number().int().nonnegative(),
    currency: z.string().default('INR'),
  }),
  shippingAddress: z.record(z.unknown()),
});

export type OrderDto = z.infer<typeof OrderDtoSchema>;

export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(OrderStatus).optional(),
});

export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().trim().max(500).optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

