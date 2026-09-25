import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CartService } from '../src/modules/cart/cart.service';
import { PricingService } from '../src/modules/pricing/pricing.service';

describe('CartService - Server-Authoritative Cart & Guest Merging', () => {
  let cartService: CartService;
  let pricingService: PricingService;
  let mockPrisma: any;

  const cartId = 'c0000000-0000-0000-0000-000000000001';
  const userId = 'u0000000-0000-0000-0000-000000000001';
  const variantId = 'v0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    pricingService = new PricingService();

    mockPrisma = {
      cart: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      cartItem: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    cartService = new CartService(mockPrisma, pricingService);
  });

  describe('addItem', () => {
    it('adds item to cart using server-side DB pricing and stock validation', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        sku: 'SAMB-500G',
        priceCents: 25000,
        status: 'ACTIVE',
        product: {
          name: 'Sambar Powder',
          status: 'ACTIVE',
        },
        inventory: {
          quantityAvailable: 20,
          quantityReserved: 2, // 18 available
        },
      });

      mockPrisma.cartItem.findFirst.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({
        id: 'item_1',
        cartId,
        variantId,
        quantity: 2,
      });

      // getCart lookup mock
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: cartId,
        items: [
          {
            variantId,
            quantity: 2,
            variant: {
              sku: 'SAMB-500G',
              packType: 'Jar',
              weightGrams: 500,
              priceCents: 25000,
              status: 'ACTIVE',
              product: { name: 'Sambar Powder' },
            },
          },
        ],
      });

      const response = await cartService.addItem(cartId, {
        variantId,
        quantity: 2,
      });

      expect(response.cartId).toBe(cartId);
      expect(response.items).toHaveLength(1);
      expect(response.items[0].unitPriceCents).toBe(25000);
      expect(response.items[0].lineTotalCents).toBe(50000);
      expect(response.pricing.subtotalCents).toBe(50000);
    });

    it('rejects adding unavailable or inactive variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        status: 'DISCONTINUED',
        product: { status: 'ACTIVE' },
      });

      await expect(
        cartService.addItem(cartId, { variantId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects adding item when available inventory is insufficient', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        status: 'ACTIVE',
        product: { status: 'ACTIVE' },
        inventory: {
          quantityAvailable: 5,
          quantityReserved: 4, // only 1 available
        },
      });

      await expect(
        cartService.addItem(cartId, { variantId, quantity: 3 }),
      ).rejects.toThrow(ConflictException);
    });

    it('clamps quantity to MAX_QUANTITY_PER_VARIANT (10) when adding item', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        status: 'ACTIVE',
        product: { status: 'ACTIVE' },
        inventory: {
          quantityAvailable: 100,
          quantityReserved: 0,
        },
      });

      mockPrisma.cartItem.findFirst.mockResolvedValue({
        id: 'item_1',
        quantity: 8,
      });

      // getCart lookup mock
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: cartId,
        items: [],
      });

      await cartService.addItem(cartId, { variantId, quantity: 5 });

      // 8 + 5 = 13, clamped to 10
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item_1' },
        data: { quantity: 10 },
      });
    });
  });

  describe('updateItem', () => {
    it('removes cart item when quantity is set to 0', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue({
        id: 'item_1',
        cartId,
        variantId,
        quantity: 3,
      });

      mockPrisma.cart.findUnique.mockResolvedValue({
        id: cartId,
        items: [],
      });

      await cartService.updateItem(cartId, variantId, { quantity: 0 });

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item_1' },
      });
    });

    it('rejects quantity exceeding the maximum per variant cap of 10', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue({
        id: 'item_1',
        cartId,
        variantId,
        quantity: 3,
      });

      await expect(
        cartService.updateItem(cartId, variantId, { quantity: 15 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('coupon validation', () => {
    it('ignores coupon when usageCount reaches or exceeds usageLimit', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: cartId,
        items: [
          {
            variantId,
            quantity: 1,
            variant: {
              sku: 'TURM-250G',
              packType: 'Pouch',
              weightGrams: 250,
              priceCents: 30000,
              status: 'ACTIVE',
              product: { name: 'Turmeric' },
            },
          },
        ],
      });

      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'LIMITED50',
        isActive: true,
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderCents: 10000,
        maxDiscountCents: null,
        usageLimit: 100,
        usageCount: 100, // Limit exhausted!
        startsAt: new Date(Date.now() - 100000),
        expiresAt: new Date(Date.now() + 100000),
      });

      const response = await cartService.getCart(cartId, 'LIMITED50');

      expect(response.pricing.couponCode).toBeUndefined();
      expect(response.pricing.couponDiscountCents).toBe(0);
    });
  });

  describe('mergeGuestCart', () => {
    it('merges guest cart items into authenticated user cart and deletes guest cart', async () => {
      const guestCartId = 'g0000000-0000-0000-0000-000000000001';
      const userCartId = 'u0000000-0000-0000-0000-000000000002';

      mockPrisma.cart.findUnique.mockResolvedValue({
        id: guestCartId,
        items: [
          { variantId, quantity: 2 },
        ],
      });

      // User already has an active cart
      mockPrisma.cart.findFirst.mockResolvedValue({ id: userCartId });

      // User cart already has 3 of this item
      mockPrisma.cartItem.findFirst.mockResolvedValue({
        id: 'user_item_1',
        cartId: userCartId,
        variantId,
        quantity: 3,
      });

      const resultCartId = await cartService.mergeGuestCart(guestCartId, userId);

      expect(resultCartId).toBe(userCartId);
      // 3 existing + 2 guest = 5
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'user_item_1' },
        data: { quantity: 5 },
      });
      expect(mockPrisma.cart.delete).toHaveBeenCalledWith({
        where: { id: guestCartId },
      });
    });
  });
});
