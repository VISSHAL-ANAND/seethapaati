import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
  CatalogListQuery,
  AddProductImageRequest,
} from '@seethapaati/contracts';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------

  async listCategories() {
    const all = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build a node map; key = category id, value = category with children array
    const nodeMap = new Map<string, any>();
    for (const cat of all) {
      nodeMap.set(cat.id, { ...cat, children: [] });
    }

    // Attach children to their parents using the parentId
    for (const cat of all) {
      if (cat.parentId && nodeMap.has(cat.parentId)) {
        nodeMap.get(cat.parentId)!.children.push(nodeMap.get(cat.id));
      }
    }

    // Return only root-level categories (no parent)
    return Array.from(nodeMap.values()).filter((node) => node.parentId === null);
  }

  async getCategoryBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({ where: { slug } });
    if (!cat) throw new NotFoundException({ error: 'CATEGORY_NOT_FOUND', message: `Category '${slug}' not found` });
    return cat;
  }

  async createCategory(dto: CreateCategoryRequest) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({ error: 'SLUG_IN_USE', message: `Slug '${dto.slug}' already exists` });
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException({ error: 'PARENT_NOT_FOUND', message: 'Parent category not found' });
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryRequest) {
    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) throw new NotFoundException({ error: 'CATEGORY_NOT_FOUND', message: 'Category not found' });

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException({ error: 'SLUG_IN_USE', message: `Slug '${dto.slug}' already in use` });
    }

    return this.prisma.category.update({ where: { id: categoryId }, data: dto });
  }

  // -------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------

  async listProducts(query: CatalogListQuery, isPublic = true) {
    const { page, limit, categorySlug, q, sortBy, sortDir } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Public callers always see only ACTIVE products; admin can filter or see all
    if (isPublic) {
      where.status = 'ACTIVE';
    } else if (query.status) {
      where.status = query.status;
    }

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
    }

    if (query.placement) {
      where.merchandising = {
        path: ['placements'],
        array_contains: query.placement,
      };
    }

    if (query.label) {
      where.OR = [
        ...(where.OR || []),
        { merchandising: { path: ['badge'], equals: query.label } },
        { merchandising: { path: ['labels'], array_contains: query.label } },
      ];
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'priceCents') {
      // Sort by minimum variant price — use name as safe fallback for now
      orderBy.name = sortDir;
    } else {
      (orderBy as any)[sortBy] = sortDir;
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          images: { orderBy: { sortOrder: 'asc' }, ...(isPublic ? { take: 1 } : {}) },
          variants: {
            where: isPublic ? { status: 'ACTIVE' } : undefined,
            include: { inventory: { select: { quantityAvailable: true, quantityReserved: true, reorderThreshold: true } } },
            orderBy: { priceCents: 'asc' },
          },
        },
      }),
    ]);

    return {
      data: products.map(this.formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductBySlug(slug: string, isPublic = true) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: { inventory: { select: { quantityAvailable: true, quantityReserved: true, reorderThreshold: true } } },
          orderBy: { priceCents: 'asc' },
        },
      },
    });

    if (!product || (isPublic && product.status !== 'ACTIVE')) {
      throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND', message: `Product '${slug}' not found` });
    }

    return this.formatProduct(product);
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: { inventory: { select: { quantityAvailable: true, quantityReserved: true, reorderThreshold: true } } },
          orderBy: { priceCents: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }

    return this.formatProduct(product);
  }

  async createProduct(dto: CreateProductRequest) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({ error: 'SLUG_IN_USE', message: `Slug '${dto.slug}' already exists` });
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException({ error: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        status: dto.status ?? 'DRAFT',
        merchandising: (dto.merchandising as any) ?? {},
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: { inventory: { select: { quantityAvailable: true, quantityReserved: true, reorderThreshold: true } } },
        },
      },
    });

    this.logger.log(`Product created: ${product.id} — ${product.name}`);
    return this.formatProduct(product);
  }

  async updateProduct(productId: string, dto: UpdateProductRequest) {
    const existing = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException({ error: 'SLUG_IN_USE', message: `Slug '${dto.slug}' already in use` });
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException({ error: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }

    const dataToUpdate: any = { ...dto };
    if (dto.merchandising !== undefined) {
      dataToUpdate.merchandising = dto.merchandising ?? {};
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: { inventory: { select: { quantityAvailable: true, quantityReserved: true, reorderThreshold: true } } },
          orderBy: { priceCents: 'asc' },
        },
      },
    });

    this.logger.log(`Product updated: ${productId}`);
    return this.formatProduct(updated);
  }

  // -------------------------------------------------------
  // VARIANTS
  // -------------------------------------------------------

  async createVariant(productId: string, dto: CreateProductVariantRequest) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    // Create variant + inventory in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const skuConflict = await tx.productVariant.findUnique({ where: { sku: dto.sku } });
      if (skuConflict) throw new ConflictException({ error: 'SKU_IN_USE', message: `SKU '${dto.sku}' already exists` });

      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: dto.sku,
          name: dto.name,
          weightGrams: dto.weightGrams,
          packType: dto.packType,
          priceCents: dto.priceCents,
          compareAtPriceCents: dto.compareAtPriceCents,
          status: 'ACTIVE',
        },
      });

      await tx.inventory.create({
        data: {
          variantId: variant.id,
          quantityAvailable: dto.initialStock ?? 0,
          quantityReserved: 0,
        },
      });

      if ((dto.initialStock ?? 0) > 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: dto.initialStock!,
            reason: 'INITIAL_STOCK',
          },
        });
      }

      return variant;
    });

    this.logger.log(`Variant created: ${result.id} — SKU: ${result.sku}`);
    return result;
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantRequest) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException({ error: 'VARIANT_NOT_FOUND', message: 'Variant not found' });

    if (dto.sku && dto.sku !== existing.sku) {
      const skuConflict = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (skuConflict) throw new ConflictException({ error: 'SKU_IN_USE', message: `SKU '${dto.sku}' already in use` });
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
      include: {
        inventory: true,
      },
    });
  }

  // -------------------------------------------------------
  // PRODUCT IMAGES
  // -------------------------------------------------------

  async addImage(productId: string, dto: AddProductImageRequest) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    const image = await this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url,
        altText: dto.altText || '',
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    this.logger.log(`Image added: ${image.id} for product ${productId}`);
    return image;
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException({ error: 'IMAGE_NOT_FOUND', message: 'Product image not found' });

    await this.prisma.productImage.delete({ where: { id: imageId } });
    this.logger.log(`Image deleted: ${imageId}`);
    return { success: true, message: 'Image deleted successfully' };
  }

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------

  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      rating: product.rating,
      reviewCount: product.reviewCount,
      merchandising: product.merchandising ?? { badge: null, labels: [], placements: [], hero: null },
      category: product.category,
      brand: product.brand,
      images: product.images || [],
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        name: v.name,
        hsnCode: v.hsnCode,
        weightGrams: v.weightGrams,
        packType: v.packType,
        priceCents: v.priceCents,
        compareAtPriceCents: v.compareAtPriceCents,
        status: v.status,
        quantityAvailable: v.inventory?.quantityAvailable ?? 0,
        quantityReserved: v.inventory?.quantityReserved ?? 0,
        reorderThreshold: v.inventory?.reorderThreshold ?? 5,
        availableStock: v.inventory ? Math.max(0, v.inventory.quantityAvailable - v.inventory.quantityReserved) : 0,
        isAvailable: v.inventory
          ? v.status === 'ACTIVE' && v.inventory.quantityAvailable > v.inventory.quantityReserved
          : false,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
