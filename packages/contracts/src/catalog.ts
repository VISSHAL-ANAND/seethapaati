import { z } from 'zod';

export enum VariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export const VariantStatusSchema = z.nativeEnum(VariantStatus);

export const ProductVariantDtoSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string().optional(),
  weightGrams: z.number().int().positive(),
  packType: z.string(), // e.g. "Glass Jar", "Craft Pouch"
  priceCents: z.number().int().nonnegative(), // Store in smallest currency unit (paise/cents)
  compareAtPriceCents: z.number().int().nonnegative().nullable().optional(),
  status: VariantStatusSchema.default(VariantStatus.ACTIVE),
  availableStock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});

export type ProductVariantDto = z.infer<typeof ProductVariantDtoSchema>;

export const ProductImageDtoSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  altText: z.string(),
  sortOrder: z.number().int().default(0),
});

export type ProductImageDto = z.infer<typeof ProductImageDtoSchema>;

export const ProductDtoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  brand: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
  images: z.array(ProductImageDtoSchema),
  variants: z.array(ProductVariantDtoSchema),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().default(0),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;
