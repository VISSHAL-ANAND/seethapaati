import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AuthUser,
  AddCartItemRequestSchema,
  AddCartItemRequest,
  UpdateCartItemRequestSchema,
  UpdateCartItemRequest,
} from '@seethapaati/contracts';

// Guest cart cookie name — HttpOnly, SameSite=Strict
const GUEST_CART_COOKIE = 'guest_cart_id';

/**
 * CART CONTROLLER
 *
 * Supports both authenticated users and anonymous guests:
 * - Authenticated users: cart is identified by their userId
 * - Guests: cart is identified by a secure HttpOnly cookie (guest_cart_id)
 *
 * All prices are server-authoritative. Client only sends variantId + quantity.
 */
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  /**
   * GET /api/v1/cart
   * Get current cart with server-calculated totals.
   * Supports optional coupon via query param.
   */
  @Public()
  @Get()
  async getCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
    @Query('coupon') couponCode?: string,
  ) {
    const cartId = await this.resolveCartId(req, res, user?.id);
    const cart = await this.cartService.getCart(cartId, couponCode);
    return { success: true, data: cart };
  }

  /**
   * POST /api/v1/cart/items
   * Add item to cart. Validates stock server-side.
   */
  @Public()
  @Post('items')
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(AddCartItemRequestSchema)) dto: AddCartItemRequest,
    @CurrentUser() user?: AuthUser,
  ) {
    const cartId = await this.resolveCartId(req, res, user?.id);
    const cart = await this.cartService.addItem(cartId, dto);
    return { success: true, data: cart };
  }

  /**
   * PATCH /api/v1/cart/items/:variantId
   * Update quantity (0 = remove item).
   */
  @Public()
  @Patch('items/:variantId')
  async updateItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(UpdateCartItemRequestSchema)) dto: UpdateCartItemRequest,
    @CurrentUser() user?: AuthUser,
  ) {
    const cartId = await this.resolveCartId(req, res, user?.id);
    const cart = await this.cartService.updateItem(cartId, variantId, dto);
    return { success: true, data: cart };
  }

  /**
   * DELETE /api/v1/cart/items/:variantId
   * Remove a specific item.
   */
  @Public()
  @Delete('items/:variantId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const cartId = await this.resolveCartId(req, res, user?.id);
    const cart = await this.cartService.updateItem(cartId, variantId, { quantity: 0 });
    return { success: true, data: cart };
  }

  /**
   * DELETE /api/v1/cart
   * Clear all items from cart.
   */
  @Public()
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    const cartId = await this.resolveCartId(req, res, user?.id);
    const cart = await this.cartService.clearCart(cartId);
    return { success: true, data: cart };
  }

  /**
   * POST /api/v1/cart/merge
   * Merge guest cart into authenticated user's cart.
   * Called after login when a guest cart cookie exists.
   */
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    const guestCartId = req.cookies?.[GUEST_CART_COOKIE];

    if (!guestCartId) {
      // No guest cart — just return the user's cart
      const cartId = await this.cartService.getOrCreateCart(user.id);
      const cart = await this.cartService.getCart(cartId);
      return { success: true, data: cart };
    }

    const userCartId = await this.cartService.mergeGuestCart(guestCartId, user.id);

    // Clear the guest cart cookie
    res.clearCookie(GUEST_CART_COOKIE);

    const cart = await this.cartService.getCart(userCartId);
    return { success: true, data: cart };
  }

  // -------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------

  /**
   * Resolve the cartId for this request:
   * 1. Authenticated user → get or create their DB-linked cart
   * 2. Guest → use cookie-based cartId, creating one if absent
   */
  private async resolveCartId(
    req: Request,
    res: Response,
    userId?: string,
  ): Promise<string> {
    if (userId) {
      return this.cartService.getOrCreateCart(userId);
    }

    // Guest: check for existing cookie
    const existingGuestCartId: string | undefined = req.cookies?.[GUEST_CART_COOKIE];
    const cartId = await this.cartService.getOrCreateCart(undefined, existingGuestCartId);

    // Set cookie if new cart was created
    if (!existingGuestCartId || existingGuestCartId !== cartId) {
      res.cookie(GUEST_CART_COOKIE, cartId, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });
    }

    return cartId;
  }
}
