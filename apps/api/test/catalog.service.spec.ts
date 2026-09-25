import { NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogService } from '../src/modules/catalog/catalog.service';

describe('CatalogService - Hierarchy, Isolation & Variant Management', () => {
  let catalogService: CatalogService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inventory: {
        create: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    catalogService = new CatalogService(mockPrisma);
  });

  describe('listCategories', () => {
    it('constructs a nested category tree from flat database rows', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat_root_1', name: 'Spices', slug: 'spices', parentId: null, sortOrder: 0 },
        { id: 'cat_child_1', name: 'Powders', slug: 'powders', parentId: 'cat_root_1', sortOrder: 1 },
        { id: 'cat_root_2', name: 'Pickles', slug: 'pickles', parentId: null, sortOrder: 2 },
      ]);

      const tree = await catalogService.listCategories();

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('cat_root_1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('cat_child_1');
      expect(tree[1].id).toBe('cat_root_2');
      expect(tree[1].children).toEqual([]);
    });
  });

  describe('listProducts', () => {
    it('enforces status: ACTIVE for public catalog queries regardless of input', async () => {
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'prod_1',
          name: 'Active Product',
          slug: 'active-product',
          description: 'Desc',
          status: 'ACTIVE',
          rating: 4.8,
          reviewCount: 12,
          category: { id: 'c1', name: 'Spices', slug: 'spices' },
          brand: null,
          images: [],
          variants: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await catalogService.listProducts(
        {
          page: 1,
          limit: 20,
          status: 'DRAFT', // Attempted override
          sortBy: 'createdAt',
          sortDir: 'desc',
        },
        true, // isPublic = true
      );

      // Verify that where clause was strictly forced to ACTIVE
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('getProductBySlug', () => {
    it('returns formatted product when product is ACTIVE', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        name: 'Turmeric Powder',
        slug: 'turmeric-powder',
        description: 'Pure turmeric',
        status: 'ACTIVE',
        rating: 5,
        reviewCount: 20,
        category: { id: 'c1', name: 'Spices', slug: 'spices' },
        brand: null,
        images: [{ url: 'https://example.com/turm.jpg', sortOrder: 0 }],
        variants: [
          {
            id: 'v1',
            sku: 'TURM-250G',
            name: '250g Pouch',
            weightGrams: 250,
            packType: 'Pouch',
            priceCents: 15000,
            compareAtPriceCents: 18000,
            status: 'ACTIVE',
            inventory: {
              quantityAvailable: 50,
              quantityReserved: 5,
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const product = await catalogService.getProductBySlug('turmeric-powder', true);

      expect(product.id).toBe('prod_1');
      expect(product.variants[0].availableStock).toBe(45);
      expect(product.variants[0].isAvailable).toBe(true);
    });

    it('rejects DRAFT product lookup with NotFoundException on public route', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod_draft',
        name: 'Secret Product',
        slug: 'secret-product',
        status: 'DRAFT',
      });

      await expect(
        catalogService.getProductBySlug('secret-product', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows DRAFT product lookup when isPublic is false (admin call)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod_draft',
        name: 'Secret Product',
        slug: 'secret-product',
        description: 'Draft description',
        status: 'DRAFT',
        rating: 0,
        reviewCount: 0,
        variants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const product = await catalogService.getProductBySlug('secret-product', false);
      expect(product.id).toBe('prod_draft');
      expect(product.status).toBe('DRAFT');
    });
  });

  describe('createVariant', () => {
    it('validates SKU uniqueness and creates variant + inventory atomically in transaction', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod_1' });
      mockPrisma.productVariant.findUnique.mockResolvedValue(null); // No SKU conflict
      mockPrisma.productVariant.create.mockResolvedValue({
        id: 'var_1',
        sku: 'NEW-SKU-100G',
      });

      const result = await catalogService.createVariant('prod_1', {
        sku: 'NEW-SKU-100G',
        name: '100g Pack',
        weightGrams: 100,
        packType: 'Pouch',
        priceCents: 10000,
        initialStock: 25,
      });

      expect(result.id).toBe('var_1');
      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var_1',
          quantityAvailable: 25,
          quantityReserved: 0,
        },
      });
      expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var_1',
          delta: 25,
          reason: 'INITIAL_STOCK',
        },
      });
    });

    it('rejects variant creation if SKU already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod_1' });
      mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'existing_var' });

      await expect(
        catalogService.createVariant('prod_1', {
          sku: 'DUPLICATE-SKU',
          name: '100g Pack',
          weightGrams: 100,
          packType: 'Pouch',
          priceCents: 10000,
          initialStock: 0,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
