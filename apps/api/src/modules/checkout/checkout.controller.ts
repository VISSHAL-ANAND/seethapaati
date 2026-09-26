import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AuthUser,
  CreateCheckoutIntentRequestSchema,
  CreateCheckoutIntentRequest,
  VerifyPaymentRequestSchema,
  VerifyPaymentRequest,
} from '@seethapaati/contracts';

/**
 * CHECKOUT CONTROLLER
 *
 * Routes for checkout intent creation and client payment signature verification.
 * Requires user authentication for all Phase 3 endpoints.
 */
@Controller('checkout')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  /**
   * POST /api/v1/checkout/intent
   * Orchestrates server-authoritative checkout, stock reservation, and Razorpay order intent.
   */
  @Post('intent')
  @HttpCode(HttpStatus.CREATED)
  async createCheckoutIntent(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateCheckoutIntentRequestSchema)) dto: CreateCheckoutIntentRequest,
  ) {
    const data = await this.checkoutService.createCheckoutIntent(user.id, dto);
    return { success: true, data };
  }

  /**
   * POST /api/v1/checkout/verify
   * Validates client payment signature returned by the Razorpay Checkout modal.
   * Read-only convenience check; does NOT transition the order to PAID.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(VerifyPaymentRequestSchema)) dto: VerifyPaymentRequest,
  ) {
    const data = await this.checkoutService.verifyPayment(user.id, dto);
    return { success: true, data };
  }
}
