import { InventoryService } from '../src/modules/inventory/inventory.service';
import { CatalogService } from '../src/modules/catalog/catalog.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Commerce Core PostgreSQL Integration Test', () => {
  let prisma: PrismaService;
  let inventoryService: InventoryService;
  let catalogService: CatalogService;

  const testSuffix = Date.now().toString().slice(-6);
  let categoryId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    inventoryService = new InventoryService(prisma);
    catalogService = new CatalogService(prisma);
  });

  afterAll(async () => {
    // Clean up created entities in reverse dependency order
    if (variantId) {
      await prisma.inventoryMovement.deleteMany({ where: { variantId } });
      await prisma.inventoryReservation.deleteMany({ where: { variantId } });
      await prisma.inventory.deleteMany({ where: { variantId } });
      await prisma.productVariant.deleteMany({ where: { id: variantId } });
    }
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
    await prisma.$disconnect();
  });

  it('creates category, product, and variant with transactional inventory in PostgreSQL', async () => {
    // 1. Create Category
    const category = await catalogService.createCategory({
      name: `Spices Test ${testSuffix}`,
      slug: `spices-test-${testSuffix}`,
      description: 'Integration test category',
    });
    categoryId = category.id;
    expect(category.id).toBeDefined();

    // 2. Create Product
    const product = await catalogService.createProduct({
      name: `Organic Pepper ${testSuffix}`,
      slug: `organic-pepper-${testSuffix}`,
      description: 'Hand-picked black pepper',
      categoryId,
      status: 'ACTIVE',
    });
    productId = product.id;
    expect(product.id).toBeDefined();
    expect(product.status).toBe('ACTIVE');

    // 3. Create Variant with 20 units initial stock
    const variant = await catalogService.createVariant(productId, {
      sku: `PEPPER-${testSuffix}`,
      name: 'Black Pepper 250g',
      weightGrams: 250,
      packType: 'Pouch',
      priceCents: 35000, // ₹350.00
      initialStock: 20,
    });
    variantId = variant.id;
    expect(variant.id).toBeDefined();

    // 4. Verify Inventory Record in PostgreSQL
    const inv = await inventoryService.getInventory(variantId);
    expect(inv.quantityAvailable).toBe(20);
    expect(inv.quantityReserved).toBe(0);
    expect(inv.isAvailable).toBe(true);
  });

  it('performs transactional SELECT FOR UPDATE reservation on real PostgreSQL', async () => {
    // Reserve 5 units for checkout session
    const reservation = await inventoryService.reserve({
      variantId,
      quantity: 5,
      checkoutSessionId: `sess_test_${testSuffix}`,
      ttlMinutes: 10,
    });

    expect(reservation.reservationId).toBeDefined();
    expect(reservation.quantity).toBe(5);

    // Verify stock reserved in PostgreSQL
    const invAfter = await inventoryService.getInventory(variantId);
    expect(invAfter.quantityAvailable).toBe(20);
    expect(invAfter.quantityReserved).toBe(5);

    // Commit reservation (simulates order payment success)
    await inventoryService.commitReservation(reservation.reservationId);

    // Verify stock permanently decremented: available = 15, reserved = 0
    const invCommitted = await inventoryService.getInventory(variantId);
    expect(invCommitted.quantityAvailable).toBe(15);
    expect(invCommitted.quantityReserved).toBe(0);
  });
});
