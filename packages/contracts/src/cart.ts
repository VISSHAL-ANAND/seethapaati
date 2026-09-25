import { z } from 'zod';

export const AddCartItemRequestSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max 50 items per line'),
});

export type AddCartItemRequest = z.infer<typeof AddCartItemRequestSchema>;

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(50, 'Max 50 items per line'),
});

export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;

export const CartItemDtoSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  packType: z.string(),
  weightGrams: z.number(),
  imageUrl: z.string().optional(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  lineTotalCents: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  availableStock: z.number().int().nonnegative(),
});

export type CartItemDto = z.infer<typeof CartItemDtoSchema>;

export const CartDtoSchema = z.object({
  id: z.string().uuid(),
  items: z.array(CartItemDtoSchema),
  itemCount: z.number().int().nonnegative(),
  pricing: z.object({
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    taxCents: z.number().int().nonnegative(),
    shippingCents: z.number().int().nonnegative(),
    freeShippingThresholdCents: z.number().int().nonnegative(),
    remainingForFreeShippingCents: z.number().int().nonnegative(),
    grandTotalCents: z.number().int().nonnegative(),
    currency: z.string().default('INR'),
  }),
});

export type CartDto = z.infer<typeof CartDtoSchema>;
