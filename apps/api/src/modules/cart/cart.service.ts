import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService, CartItemInput } from '../pricing/pricing.service';
import {
  AddCartItemRequest,
  UpdateCartItemRequest,
  CartResponse,
} from '@seethapaati/contracts';

/**
 * CART SERVICE — Server Authoritative
 *
 * Rules:
 * 1. Client sends ONLY variantId + quantity. Never price.
 * 2. All prices are fetched from the database at runtime.
 * 3. Cart totals are always calculated by PricingService.
 * 4. Guest carts are identified by cartId cookie.
 * 5. Cart merge (guest → auth) is handled on login.
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
  ) {}

  /**
   * Get or create a cart for a user or anonymous session.
   * Strictly enforces cart ownership isolation:
   * - Guest sessions can only access anonymous carts (userId === null)
   * - Authenticated users can only access carts matching their own userId
   */
  async getOrCreateCart(userId?: string, cartId?: string): Promise<string> {
    if (userId) {
      // Authenticated user
      if (cartId) {
        const existing = await this.prisma.cart.findUnique({ where: { id: cartId } });
        if (existing && existing.userId === userId) {
          return existing.id;
        }
      }

      // Find user's existing active cart
      const userCart = await this.prisma.cart.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      if (userCart) return userCart.id;

      // Create new cart for authenticated user
      const cart = await this.prisma.cart.create({
        data: { userId },
      });
      return cart.id;
    }

    // Guest / Anonymous session
    if (cartId) {
      const existing = await this.prisma.cart.findUnique({ where: { id: cartId } });
      // Reject IDOR: guests cannot claim carts belonging to registered users
      if (existing && existing.userId === null) {
        return existing.id;
      }
    }

    // Create new anonymous guest cart
    const cart = await this.prisma.cart.create({
      data: { userId: null },
    });
    return cart.id;
  }

  /**
   * Get cart with server-authoritative pricing calculation.
   */
  async getCart(cartId: string, couponCode?: string): Promise<CartResponse> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
                inventory: { select: { quantityAvailable: true, quantityReserved: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException({ error: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    // Fetch coupon if provided
    let couponData: Prisma.CouponGetPayload<Record<string, never>> | null = null;
    if (couponCode) {
      couponData = await this.prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        !couponData ||
        !couponData.isActive ||
        (couponData.startsAt && couponData.startsAt > new Date()) ||
        (couponData.expiresAt && couponData.expiresAt < new Date()) ||
        (couponData.usageLimit !== null && couponData.usageCount >= couponData.usageLimit)
      ) {
        couponData = null;
      }
    }

    // Build pricing inputs from DB-fetched data (never client)
    const pricingInputs: CartItemInput[] = cart.items
      .filter((item) => item.variant.status === 'ACTIVE')
      .map((item) => ({
        variantId: item.variantId,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        packType: item.variant.packType,
        weightGrams: item.variant.weightGrams,
        quantity: item.quantity,
        unitPriceCents: item.variant.priceCents, // DB price — not client-supplied
      }));

    const { lineItems, breakdown } = this.pricing.calculate(
      pricingInputs,
      couponData
        ? {
            code: couponData.code,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue,
            minOrderCents: couponData.minOrderCents,
            maxDiscountCents: couponData.maxDiscountCents,
          }
        : null,
    );

    return { cartId: cart.id, items: lineItems, pricing: breakdown };
  }

  /**
   * Add item to cart.
   * Validates:
   * - Variant exists and is ACTIVE
   * - Stock is available
   * - Quantity doesn't exceed per-variant cap
   */
  async addItem(cartId: string, dto: AddCartItemRequest): Promise<CartResponse> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: {
        inventory: true,
        product: { select: { status: true } },
      },
    });

    if (!variant || variant.status !== 'ACTIVE') {
      throw new NotFoundException({
        error: 'VARIANT_NOT_FOUND',
        message: 'Product variant not found or is unavailable',
      });
    }

    if (variant.product.status !== 'ACTIVE') {
      throw new BadRequestException({
        error: 'PRODUCT_UNAVAILABLE',
        message: 'This product is not currently available',
      });
    }

    const effectiveAvailable = variant.inventory
      ? variant.inventory.quantityAvailable - variant.inventory.quantityReserved
      : 0;

    if (effectiveAvailable < dto.quantity) {
      throw new ConflictException({
        error: 'INSUFFICIENT_STOCK',
        message: `Only ${effectiveAvailable} unit(s) available`,
        available: effectiveAvailable,
      });
    }

    const maxQty = this.pricing.getMaxQuantityPerVariant();

    // Upsert: update quantity if item already in cart, else insert
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findFirst({
        where: { cartId, variantId: dto.variantId },
      });

      if (existing) {
        const newQty = Math.min(existing.quantity + dto.quantity, maxQty);
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        const qty = Math.min(dto.quantity, maxQty);
        await tx.cartItem.create({
          data: { cartId, variantId: dto.variantId, quantity: qty },
        });
      }

      // Touch cart updatedAt
      await tx.cart.update({ where: { id: cartId }, data: {} });
    });

    return this.getCart(cartId);
  }

  /**
   * Update or remove a cart item.
   * quantity=0 removes the item.
   */
  async updateItem(cartId: string, variantId: string, dto: UpdateCartItemRequest): Promise<CartResponse> {
    const item = await this.prisma.cartItem.findFirst({
      where: { cartId, variantId },
    });

    if (!item) {
      throw new NotFoundException({ error: 'ITEM_NOT_FOUND', message: 'Item not found in cart' });
    }

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      if (dto.quantity > this.pricing.getMaxQuantityPerVariant()) {
        throw new BadRequestException({
          error: 'QUANTITY_EXCEEDED',
          message: `Maximum quantity per item is ${this.pricing.getMaxQuantityPerVariant()}`,
        });
      }
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: dto.quantity },
      });
    }

    await this.prisma.cart.update({ where: { id: cartId }, data: {} });
    return this.getCart(cartId);
  }

  /**
   * Remove all items from a cart.
   */
  async clearCart(cartId: string): Promise<CartResponse> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    await this.prisma.cart.update({ where: { id: cartId }, data: {} });
    return this.getCart(cartId);
  }

  /**
   * Merge a guest cart into an authenticated user's cart after login.
   * Items in the guest cart are upserted into the user's cart.
   * Guest cart is then deleted.
   *
   * Security guards:
   * - Never merge a cart into itself (guestCartId === userCartId)
   * - Only merge carts that actually belong to guests (guestCart.userId === null)
   */
  async mergeGuestCart(guestCartId: string, userId: string): Promise<string> {
    const userCartId = await this.getOrCreateCart(userId);

    // Guard: Prevent self-merge session fixation/deletion
    if (guestCartId === userCartId) {
      return userCartId;
    }

    const guestCart = await this.prisma.cart.findUnique({
      where: { id: guestCartId },
      include: { items: true },
    });

    // Guard: Cart must exist, must be an anonymous guest cart (userId === null), and have items
    if (!guestCart || guestCart.userId !== null || guestCart.items.length === 0) {
      return userCartId;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const guestItem of guestCart.items) {
        const existing = await tx.cartItem.findFirst({
          where: { cartId: userCartId, variantId: guestItem.variantId },
        });

        if (existing) {
          const merged = Math.min(existing.quantity + guestItem.quantity, this.pricing.getMaxQuantityPerVariant());
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: merged } });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCartId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
            },
          });
        }
      }

      // Delete guest cart
      await tx.cart.delete({ where: { id: guestCartId } });
    });

    this.logger.log(`Merged guest cart ${guestCartId} into user ${userId}'s cart ${userCartId}`);
    return userCartId;
  }
}
