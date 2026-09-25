import { z } from 'zod';

export const InventoryStatusSchema = z.object({
  variantId: z.string().uuid(),
  sku: z.string(),
  quantityAvailable: z.number().int().nonnegative(),
  quantityReserved: z.number().int().nonnegative(),
  reorderThreshold: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});

export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;

export const UpdateInventoryRequestSchema = z.object({
  quantityAvailable: z.number().int().nonnegative(),
  reorderThreshold: z.number().int().nonnegative().optional(),
});

export type UpdateInventoryRequest = z.infer<typeof UpdateInventoryRequestSchema>;
