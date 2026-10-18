import { z } from 'zod';

// -------------------------------------------------------
// RE-EXPORT: VariantStatus (matches Prisma enum, approved in Phase 1)
// -------------------------------------------------------

export enum VariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export const VariantStatusSchema = z.nativeEnum(VariantStatus);

// -------------------------------------------------------
// CATEGORY CONTRACTS
// -------------------------------------------------------

export const CategoryDtoSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  children: z.array(z.lazy((): z.ZodTypeAny => CategoryDtoSchema)).optional(),
});

export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

export const CreateCategoryRequestSchema = z.object({
  parentId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, letters, numbers, hyphens only'),
  description: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export type CreateCategoryRequest = z.input<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.partial();
export type UpdateCategoryRequest = z.input<typeof UpdateCategoryRequestSchema>;

// -------------------------------------------------------
// MERCHANDISING CONTRACTS
// -------------------------------------------------------

export const MerchandisingLabelSchema = z.enum([
  'NEW',
  'NEW_ARRIVAL',
  'FEATURED',
  'BESTSELLER',
  'LIMITED',
  'SALE',
  'COMING_SOON',
]);
export type MerchandisingLabel = z.infer<typeof MerchandisingLabelSchema>;

export const MerchandisingPlacementSchema = z.enum([
  'HERO',
  'NEW_ARRIVALS',
  'FEATURED',
  'BESTSELLERS',
  'SALE',
  'RECOMMENDED',
]);
export type MerchandisingPlacement = z.infer<typeof MerchandisingPlacementSchema>;

export const HeroConfigurationSchema = z.object({
  desktopImageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  headline: z.string().max(160).optional(),
  subheadline: z.string().max(500).optional(),
  ctaLabel: z.string().max(60).optional(),
  ctaDestination: z.string().max(200).optional(),
  priority: z.number().int().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type HeroConfiguration = z.infer<typeof HeroConfigurationSchema>;

export const ProductMerchandisingSchema = z.object({
  badge: MerchandisingLabelSchema.optional(),
  labels: z.array(MerchandisingLabelSchema).default([]),
  placements: z.array(MerchandisingPlacementSchema).default([]),
  priority: z.number().int().min(0).default(0),
  hero: HeroConfigurationSchema.optional(),
});
export type ProductMerchandising = z.infer<typeof ProductMerchandisingSchema>;

// -------------------------------------------------------
// PRODUCT CONTRACTS
// -------------------------------------------------------

export const ProductStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  status: ProductStatusSchema.default('DRAFT'),
  merchandising: ProductMerchandisingSchema.optional(),
});

export type CreateProductRequest = z.input<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.input<typeof UpdateProductRequestSchema>;

export const ProductVariantDtoSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().optional(),
  sku: z.string(),
  name: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  weightGrams: z.number().int().positive(),
  packType: z.string(),
  priceCents: z.number().int().nonnegative(),
  compareAtPriceCents: z.number().int().nonnegative().nullable().optional(),
  status: VariantStatusSchema.default(VariantStatus.ACTIVE),
  availableStock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  quantityAvailable: z.number().int().optional(),
  quantityReserved: z.number().int().optional(),
  reorderThreshold: z.number().int().optional(),
});

export type ProductVariantDto = z.infer<typeof ProductVariantDtoSchema>;

export const ProductImageDtoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string(),
  altText: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export type ProductImageDto = z.infer<typeof ProductImageDtoSchema>;

export const AddProductImageRequestSchema = z.object({
  url: z.string().min(1, 'Image URL is required'),
  altText: z.string().max(255).optional().default(''),
  sortOrder: z.number().int().optional().default(0),
});

export type AddProductImageRequest = z.input<typeof AddProductImageRequestSchema>;

export const ProductDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  status: ProductStatusSchema,
  rating: z.number().default(0),
  reviewCount: z.number().int().default(0),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  brand: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
  images: z.array(ProductImageDtoSchema).default([]),
  variants: z.array(ProductVariantDtoSchema),
  merchandising: ProductMerchandisingSchema.optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;

// -------------------------------------------------------
// PRODUCT VARIANT CONTRACTS
// -------------------------------------------------------

export const CreateProductVariantRequestSchema = z.object({
  sku: z.string().min(1).max(100).toUpperCase(),
  name: z.string().max(255).optional(),
  hsnCode: z.string().max(8).optional(),
  weightGrams: z.number().int().positive(),
  packType: z.string().min(1).max(100).default('Pouch'),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional(),
  initialStock: z.number().int().nonnegative().optional().default(0),
});

export type CreateProductVariantRequest = z.input<typeof CreateProductVariantRequestSchema>;

export const UpdateProductVariantRequestSchema = CreateProductVariantRequestSchema
  .omit({ initialStock: true })
  .partial()
  .extend({
    status: VariantStatusSchema.optional(),
  });
export type UpdateProductVariantRequest = z.input<typeof UpdateProductVariantRequestSchema>;

// -------------------------------------------------------
// PUBLIC CATALOG QUERY
// -------------------------------------------------------

export const CatalogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  categorySlug: z.string().optional(),
  status: ProductStatusSchema.optional(), // Only honoured by admin routes; public routes always force ACTIVE
  q: z.string().max(200).optional(),
  placement: MerchandisingPlacementSchema.optional(),
  label: MerchandisingLabelSchema.optional(),
  sortBy: z.enum(['createdAt', 'name', 'priceCents']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CatalogListQuery = z.infer<typeof CatalogListQuerySchema>;
