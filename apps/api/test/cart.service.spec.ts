import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CartService } from '../src/modules/cart/cart.service';
import { PricingService } from '../src/modules/pricing/pricing.service';

describe('CartService - Server-Authoritative Cart & Guest Merging', () => {
  let cartService: CartService;
  let pricingService: PricingService;
  let mockPrisma: any;
  let taxConfig: any;

  const cartId = 'c0000000-0000-0000-0000-000000000001';
  const userId = 'u0000000-0000-0000-0000-000000000001';
  const variantId = 'v0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    pricingService = new PricingService();
    taxConfig = { getRate: jest.fn().mockResolvedValue({ taxRatePercent: 5 }) };

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

    cartService = new CartService(mockPrisma, pricingService, taxConfig);
  });

  describe('addItem', () => {
    it('adds item to cart using server-side DB pricing and stock validation', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        sku: 'SAMB-500G',
        priceCents: 25000,
        status: 'ACTIVE',
        hsnCode: '0910',
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
              hsnCode: '0910',
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
              hsnCode: '0910',
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

  describe('getOrCreateCart isolation', () => {
    it('prevents guest from claiming a registered user cart (IDOR prevention)', async () => {
      const userCartId = 'c-user-123';
      const newGuestCartId = 'c-guest-new';

      // Attacker supplies a cartId that belongs to a registered user
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: userCartId,
        userId: 'u-legit-user',
      });
      mockPrisma.cart.create.mockResolvedValue({
        id: newGuestCartId,
        userId: null,
      });

      // Guest calls getOrCreateCart with user's cartId
      const result = await cartService.getOrCreateCart(undefined, userCartId);

      // Must NOT return the user's cart; must create a new guest cart
      expect(result).toBe(newGuestCartId);
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: { userId: null },
      });
    });

    it('allows guest to reuse an anonymous cart where userId is null', async () => {
      const guestCartId = 'c-guest-123';
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: guestCartId,
        userId: null,
      });

      const result = await cartService.getOrCreateCart(undefined, guestCartId);

      expect(result).toBe(guestCartId);
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('allows authenticated user to reuse cart matching their userId', async () => {
      const userCartId = 'c-user-123';
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: userCartId,
        userId,
      });

      const result = await cartService.getOrCreateCart(userId, userCartId);

      expect(result).toBe(userCartId);
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });
  });

  describe('mergeGuestCart', () => {
    it('merges guest cart items into authenticated user cart and deletes guest cart', async () => {
      const guestCartId = 'g0000000-0000-0000-0000-000000000001';
      const userCartId = 'u0000000-0000-0000-0000-000000000002';

      // User already has an active cart
      mockPrisma.cart.findFirst.mockResolvedValue({ id: userCartId });

      mockPrisma.cart.findUnique.mockResolvedValue({
        id: guestCartId,
        userId: null, // Legitimate anonymous guest cart
        items: [
          { variantId, quantity: 2 },
        ],
      });

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

    it('prevents self-merge session fixation and cart deletion when guestCartId equals userCartId', async () => {
      const userCartId = 'u0000000-0000-0000-0000-000000000002';
      mockPrisma.cart.findFirst.mockResolvedValue({ id: userCartId });

      const resultCartId = await cartService.mergeGuestCart(userCartId, userId);

      expect(resultCartId).toBe(userCartId);
      expect(mockPrisma.cart.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.cart.delete).not.toHaveBeenCalled();
    });

    it('rejects merging a cart that belongs to another registered user', async () => {
      const victimCartId = 'victim-cart-999';
      const userCartId = 'u0000000-0000-0000-0000-000000000002';
      mockPrisma.cart.findFirst.mockResolvedValue({ id: userCartId });

      mockPrisma.cart.findUnique.mockResolvedValue({
        id: victimCartId,
        userId: 'other-user-id', // Belongs to another user!
        items: [{ variantId, quantity: 2 }],
      });

      const resultCartId = await cartService.mergeGuestCart(victimCartId, userId);

      expect(resultCartId).toBe(userCartId);
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).not.toHaveBeenCalled();
      expect(mockPrisma.cart.delete).not.toHaveBeenCalled();
    });
  });
});
