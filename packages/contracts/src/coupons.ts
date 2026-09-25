import { z } from 'zod';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export const DiscountTypeSchema = z.nativeEnum(DiscountType);

export const CouponDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: DiscountTypeSchema,
  discountValue: z.number().int().positive(),
  minOrderCents: z.number().int().nonnegative().default(0),
  maxDiscountCents: z.number().int().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  usageCount: z.number().int().nonnegative().default(0),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CouponDto = z.infer<typeof CouponDtoSchema>;
