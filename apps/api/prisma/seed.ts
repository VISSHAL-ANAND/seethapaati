import { PrismaClient, RoleName, ProductStatus, VariantStatus, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PermissionName, ROLE_DEFAULT_PERMISSIONS } from '@seethapaati/contracts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seethapaati database seeding...');

  // 1. Seed Roles & Permissions
  console.log('Creating Roles and Permissions...');
  for (const permName of Object.values(PermissionName)) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: {
        name: permName,
        description: `Permission for ${permName}`,
      },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  for (const [roleName, permissions] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName as RoleName },
      update: {},
      create: {
        name: roleName as RoleName,
        description: `Role for ${roleName}`,
      },
    });

    for (const perm of permissions) {
      const permissionId = permMap.get(perm);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }
  }

  // 2. Seed Default Admin & Patron User
  console.log('Seeding Default Admin Account...');
  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Seethapaati2026', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@seethapaati.com' },
    update: {},
    create: {
      email: 'admin@seethapaati.com',
      passwordHash: adminPasswordHash,
      fullName: 'Seethapaati Administrator',
      phone: '+919876543210',
      isEmailVerified: true,
      userRoles: adminRole
        ? {
            create: {
              roleId: adminRole.id,
            },
          }
        : undefined,
    },
  });

  // Default Customer Patron Account
  const customerRole = await prisma.role.findUnique({ where: { name: RoleName.CUSTOMER } });
  const customerPasswordHash = await bcrypt.hash('Patron@123456', 12);
  await prisma.user.upsert({
    where: { email: 'patron@seethapaati.com' },
    update: {},
    create: {
      email: 'patron@seethapaati.com',
      passwordHash: customerPasswordHash,
      fullName: 'Aravind Swaminathan',
      phone: '+919876543211',
      isEmailVerified: true,
      userRoles: customerRole
        ? {
            create: {
              roleId: customerRole.id,
            },
          }
        : undefined,
      addresses: {
        create: {
          fullName: 'Aravind Swaminathan',
          phone: '+919876543211',
          addressLine1: '14, Luz Church Road',
          addressLine2: 'Mylapore',
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600004',
          country: 'IN',
          isDefault: true,
        },
      },
    },
  });

  // 3. Seed Brand
  console.log('Seeding Brand...');
  const brand = await prisma.brand.upsert({
    where: { slug: 'seethapaati' },
    update: {},
    create: {
      name: 'Seethapaati',
      slug: 'seethapaati',
    },
  });

  // 4. Seed Categories
  console.log('Seeding Categories...');
  const spicesCategory = await prisma.category.upsert({
    where: { slug: 'spices-masalas' },
    update: {},
    create: {
      name: 'Spices & Masalas',
      slug: 'spices-masalas',
      description: 'Slow-roasted spice powders, sun-dried chilies, and authentic South Indian curry blends.',
      sortOrder: 1,
    },
  });

  const beveragesCategory = await prisma.category.upsert({
    where: { slug: 'health-mixes-beverages' },
    update: {},
    create: {
      name: 'Health Mixes & Beverages',
      slug: 'health-mixes-beverages',
      description: 'Nourishing ABC malt, multigrain health mixes, and traditional pantry beverages.',
      sortOrder: 2,
    },
  });

  const teaCategory = await prisma.category.upsert({
    where: { slug: 'traditional-teas' },
    update: {},
    create: {
      name: 'Traditional Teas',
      slug: 'traditional-teas',
      description: 'Single-estate loose leaf teas and aromatic Ceylon blends.',
      sortOrder: 3,
    },
  });

  const staplesCategory = await prisma.category.upsert({
    where: { slug: 'pantry-staples' },
    update: {},
    create: {
      name: 'Pantry & Staples',
      slug: 'pantry-staples',
      description: 'Handpicked nuts, cold-pressed seed blends, and essential South Indian pantry staples.',
      sortOrder: 4,
    },
  });

  // 5. Seed Statutory Tax Rates (Indian GST for food & beverages)
  console.log('Seeding Tax Rates...');
  await prisma.taxRate.upsert({
    where: { hsnCode: '0910' },
    update: {},
    create: {
      hsnCode: '0910',
      description: 'Ginger, saffron, turmeric, thyme, bay leaves, curry and other spices',
      taxRatePercent: 5.0,
      isActive: true,
    },
  });

  await prisma.taxRate.upsert({
    where: { hsnCode: '0902' },
    update: {},
    create: {
      hsnCode: '0902',
      description: 'Tea, whether or not flavored',
      taxRatePercent: 5.0,
      isActive: true,
    },
  });

  await prisma.taxRate.upsert({
    where: { hsnCode: '1901' },
    update: {},
    create: {
      hsnCode: '1901',
      description: 'Malt extract, food preparations of flour, meal, starch or malt extract (ABC Malt & Health Mixes)',
      taxRatePercent: 12.0,
      isActive: true,
    },
  });

  await prisma.taxRate.upsert({
    where: { hsnCode: '2008' },
    update: {},
    create: {
      hsnCode: '2008',
      description: 'Nuts, seeds, and other edible parts of plants, otherwise prepared or preserved',
      taxRatePercent: 12.0,
      isActive: true,
    },
  });

  // 6. Seed Curated Products
  console.log('Seeding Curated Products and Inventory...');

  // Product 1: One Powder for All
  const prod1 = await prisma.product.upsert({
    where: { slug: 'one-powder-for-all' },
    update: {},
    create: {
      name: 'One Powder for All',
      slug: 'one-powder-for-all',
      description:
        'A master spice blend hand-ground from fifteen sun-dried spices. Crafted to elevate sambars, curries, vegetable stir-fries, and daily South Indian kitchen preparations without artificial additives or preservatives.',
      categoryId: spicesCategory.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      rating: 4.9,
      reviewCount: 38,
      merchandising: {
        badge: 'BESTSELLER',
        placements: ['HERO', 'FEATURED', 'BESTSELLERS'],
      },
      images: {
        create: [
          {
            url: '/images/masala.jpg',
            altText: 'One Powder for All artisanal spice blend in brass bowl',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // Variant 1A: 250g
  const var1A = await prisma.productVariant.upsert({
    where: { sku: 'OPFA-250G' },
    update: {},
    create: {
      productId: prod1.id,
      sku: 'OPFA-250G',
      name: '250g Artisanal Pouch',
      hsnCode: '0910',
      weightGrams: 250,
      packType: 'Pouch',
      priceCents: 24900, // ₹249.00
      compareAtPriceCents: 29900,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var1A.id },
    update: { quantityAvailable: 150 },
    create: {
      variantId: var1A.id,
      quantityAvailable: 150,
      quantityReserved: 0,
      reorderThreshold: 15,
    },
  });

  // Variant 1B: 500g
  const var1B = await prisma.productVariant.upsert({
    where: { sku: 'OPFA-500G' },
    update: {},
    create: {
      productId: prod1.id,
      sku: 'OPFA-500G',
      name: '500g Pantry Pack',
      hsnCode: '0910',
      weightGrams: 500,
      packType: 'Pouch',
      priceCents: 45900, // ₹459.00
      compareAtPriceCents: 54900,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var1B.id },
    update: { quantityAvailable: 100 },
    create: {
      variantId: var1B.id,
      quantityAvailable: 100,
      quantityReserved: 0,
      reorderThreshold: 10,
    },
  });

  // Product 2: ABC Malt Health Mix
  const prod2 = await prisma.product.upsert({
    where: { slug: 'abc-malt-health-mix' },
    update: {},
    create: {
      name: 'ABC Malt Health Mix',
      slug: 'abc-malt-health-mix',
      description:
        'A nutrient-dense blend of Apple, Beetroot, and Carrot infused with sprouted grains, nuts, and natural country sugar. Wholesome morning nourishment for children and adults alike.',
      categoryId: beveragesCategory.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 24,
      merchandising: {
        badge: 'NEW_ARRIVAL',
        placements: ['NEW_ARRIVALS', 'FEATURED'],
      },
      images: {
        create: [
          {
            url: '/images/mix.png',
            altText: 'ABC Malt Health Mix preparation',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const var2A = await prisma.productVariant.upsert({
    where: { sku: 'ABCM-300G' },
    update: {},
    create: {
      productId: prod2.id,
      sku: 'ABCM-300G',
      name: '300g Tin',
      hsnCode: '1901',
      weightGrams: 300,
      packType: 'Tin',
      priceCents: 34900, // ₹349.00
      compareAtPriceCents: 39900,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var2A.id },
    update: { quantityAvailable: 80 },
    create: {
      variantId: var2A.id,
      quantityAvailable: 80,
      quantityReserved: 0,
      reorderThreshold: 10,
    },
  });

  // Product 3: Premium Ceylon Tea Blend
  const prod3 = await prisma.product.upsert({
    where: { slug: 'premium-ceylon-tea-blend' },
    update: {},
    create: {
      name: 'Premium Ceylon Tea Blend',
      slug: 'premium-ceylon-tea-blend',
      description:
        'Carefully curated high-grown Ceylon BOPF tea leaves delivering a brisk, amber cup with a clean finish. Suitable for brisk black tea infusions or full-bodied milk chai.',
      categoryId: teaCategory.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      rating: 4.9,
      reviewCount: 19,
      merchandising: {
        badge: 'FEATURED',
        placements: ['FEATURED', 'RECOMMENDED'],
      },
      images: {
        create: [
          {
            url: '/images/tea.png',
            altText: 'Premium Ceylon Tea Blend loose leaves and cup',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const var3A = await prisma.productVariant.upsert({
    where: { sku: 'CTEA-250G' },
    update: {},
    create: {
      productId: prod3.id,
      sku: 'CTEA-250G',
      name: '250g Airtight Foil Pack',
      hsnCode: '0902',
      weightGrams: 250,
      packType: 'Pouch',
      priceCents: 29900, // ₹299.00
      compareAtPriceCents: 35000,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var3A.id },
    update: { quantityAvailable: 120 },
    create: {
      variantId: var3A.id,
      quantityAvailable: 120,
      quantityReserved: 0,
      reorderThreshold: 12,
    },
  });

  // Product 4: Traditional Rasam Powder
  const prod4 = await prisma.product.upsert({
    where: { slug: 'traditional-rasam-powder' },
    update: {},
    create: {
      name: 'Traditional Rasam Powder',
      slug: 'traditional-rasam-powder',
      description:
        'Heirloom recipe rasam podi roasted with whole cumin, black pepper, toor dal, and coriander seeds. Creates a comforting, digestive broth that captures the heritage of South Indian kitchens.',
      categoryId: spicesCategory.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      rating: 5.0,
      reviewCount: 42,
      merchandising: {
        badge: 'BESTSELLER',
        placements: ['BESTSELLERS', 'RECOMMENDED'],
      },
      images: {
        create: [
          {
            url: '/images/masala.jpg',
            altText: 'Traditional Rasam Powder in earthen vessel',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const var4A = await prisma.productVariant.upsert({
    where: { sku: 'TRP-200G' },
    update: {},
    create: {
      productId: prod4.id,
      sku: 'TRP-200G',
      name: '200g Pouch',
      hsnCode: '0910',
      weightGrams: 200,
      packType: 'Pouch',
      priceCents: 19900, // ₹199.00
      compareAtPriceCents: 23000,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var4A.id },
    update: { quantityAvailable: 110 },
    create: {
      variantId: var4A.id,
      quantityAvailable: 110,
      quantityReserved: 0,
      reorderThreshold: 10,
    },
  });

  // Product 5: Traditional Nuts & Seed Blend
  const prod5 = await prisma.product.upsert({
    where: { slug: 'traditional-nuts-seed-blend' },
    update: {},
    create: {
      name: 'Traditional Nuts & Seed Blend',
      slug: 'traditional-nuts-seed-blend',
      description:
        'Slow dry-roasted almonds, cashews, pumpkin seeds, and sunflower seeds seasoned with pink Himalayan crystal salt. Rich in healthy fats and high-protein crunch.',
      categoryId: staplesCategory.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      rating: 4.7,
      reviewCount: 15,
      merchandising: {
        badge: 'LIMITED',
        placements: ['RECOMMENDED'],
      },
      images: {
        create: [
          {
            url: '/images/nuts.png',
            altText: 'Traditional Nuts and Seed Blend bowl',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const var5A = await prisma.productVariant.upsert({
    where: { sku: 'TNSB-250G' },
    update: {},
    create: {
      productId: prod5.id,
      sku: 'TNSB-250G',
      name: '250g Jar',
      hsnCode: '2008',
      weightGrams: 250,
      packType: 'Jar',
      priceCents: 39900, // ₹399.00
      compareAtPriceCents: 45000,
      status: VariantStatus.ACTIVE,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: var5A.id },
    update: { quantityAvailable: 75 },
    create: {
      variantId: var5A.id,
      quantityAvailable: 75,
      quantityReserved: 0,
      reorderThreshold: 8,
    },
  });

  // 7. Seed Initial Promotional Coupon
  console.log('Seeding Coupons...');
  await prisma.coupon.upsert({
    where: { code: 'SEETHA10' },
    update: {},
    create: {
      code: 'SEETHA10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10, // 10% off
      minOrderCents: 49900, // minimum order ₹499
      maxDiscountCents: 10000, // max discount ₹100
      usageLimit: 1000,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      discountType: DiscountType.FIXED,
      discountValue: 5000, // ₹50 flat off
      minOrderCents: 39900, // minimum order ₹399
      usageLimit: 500,
      isActive: true,
    },
  });

  console.log('✅ Seethapaati database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
