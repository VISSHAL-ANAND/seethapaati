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
});

export type CreateProductRequest = z.input<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.input<typeof UpdateProductRequestSchema>;

export const ProductVariantDtoSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().optional(),
  sku: z.string(),
  name: z.string().nullable().optional(),
  weightGrams: z.number().int().positive(),
  packType: z.string(),
  priceCents: z.number().int().nonnegative(),
  compareAtPriceCents: z.number().int().nonnegative().nullable().optional(),
  status: VariantStatusSchema.default(VariantStatus.ACTIVE),
  availableStock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});

export type ProductVariantDto = z.infer<typeof ProductVariantDtoSchema>;

export const ProductImageDtoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string(),
  altText: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export type ProductImageDto = z.infer<typeof ProductImageDtoSchema>;

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
  }).optional(),
  brand: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
  images: z.array(ProductImageDtoSchema).default([]),
  variants: z.array(ProductVariantDtoSchema),
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
  weightGrams: z.number().int().positive(),
  packType: z.string().min(1).max(100).default('Pouch'),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional(),
  initialStock: z.number().int().nonnegative().optional().default(0),
});

export type CreateProductVariantRequest = z.input<typeof CreateProductVariantRequestSchema>;

export const UpdateProductVariantRequestSchema = CreateProductVariantRequestSchema
  .omit({ initialStock: true })
  .partial();
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
  sortBy: z.enum(['createdAt', 'name', 'priceCents']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CatalogListQuery = z.infer<typeof CatalogListQuerySchema>;
