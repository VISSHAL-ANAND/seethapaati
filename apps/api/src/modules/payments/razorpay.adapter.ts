import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');
import {
  PaymentGatewayAdapter,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyPaymentSignatureParams,
} from './payment-gateway.interface';

/**
 * RAZORPAY ADAPTER
 *
 * Implements PaymentGatewayAdapter.
 * Rules:
 * - Creates orders with auto-capture enabled (payment_capture: 1)
 * - Timing-safe HMAC-SHA256 signature verification for client response and webhook payloads
 * - Never leaks RAZORPAY_KEY_SECRET to client
 * - Exposes only RAZORPAY_KEY_ID to client
 */
@Injectable()
export class RazorpayAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(RazorpayAdapter.name);
  private readonly client: any;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_placeholder');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', 'rzp_secret_placeholder');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', 'rzp_webhook_placeholder');

    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Create Razorpay Order with automatic capture enabled.
   * Call OUTSIDE PostgreSQL transaction.
   */
  async createRefund(paymentId: string, amountCents: number, refundId: string): Promise<{ id: string; status?: string }> {
    try {
      const refund = await this.client.payments.refund(paymentId, {
        amount: amountCents,
        notes: { refundId },
      });
      return { id: refund.id, status: refund.status };
    } catch (err) {
      this.logger.error(`Razorpay refund failed: ${(err as Error).message}`);
      throw new BadGatewayException({ error: 'PAYMENT_REFUND_GATEWAY_ERROR', message: 'Refund could not be submitted to the payment gateway.' });
    }
  }

  async findRefundByInternalId(paymentId: string, refundId: string): Promise<{ id: string; status?: string } | null> {
    try {
      const result = await this.client.refunds.all({ payment_id: paymentId });
      const items = result?.items ?? [];
      const found = items.find((r: any) => r?.notes?.refundId === refundId);
      return found ? { id: found.id, status: found.status } : null;
    } catch (err) {
      this.logger.error(`Razorpay refund reconciliation failed: ${(err as Error).message}`);
      throw new BadGatewayException({
        error: 'PAYMENT_REFUND_RECONCILIATION_ERROR',
        message: 'Could not reconcile the refund with Razorpay.',
      });
    }
  }

  async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    try {
      const order = await this.client.orders.create({
        amount: params.amountCents, // Razorpay takes amount in smallest currency unit (paise)
        currency: params.currency,
        receipt: params.receipt,
        payment_capture: 1, // Auto-capture canonical representation per Razorpay API
        notes: params.notes,
      });

      return {
        gatewayOrderId: order.id,
        gateway: 'RAZORPAY',
        amountCents: Number(order.amount),
        currency: order.currency,
      };
    } catch (err) {
      this.logger.error(`Razorpay order creation failed: ${(err as Error).message}`, (err as Error).stack);
      throw new BadGatewayException({
        error: 'PAYMENT_GATEWAY_ERROR',
        message: 'Failed to create payment order with gateway. Please try again.',
      });
    }
  }

  /**
   * Verify signature returned by Razorpay Checkout JS modal.
   * Formula: HMAC_SHA256(orderId + "|" + paymentId, secret) === signature
   * Uses timingSafeEqual to prevent timing attacks.
   */
  verifyPaymentSignature(params: VerifyPaymentSignatureParams): boolean {
    try {
      const payload = `${params.orderId}|${params.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(payload)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
      const receivedBuf = Buffer.from(params.signature, 'utf-8');

      if (expectedBuf.length !== receivedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch (err) {
      this.logger.warn(`Signature verification failed with error: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Verify Razorpay Webhook signature (header: X-Razorpay-Signature).
   * Formula: HMAC_SHA256(rawBody, webhookSecret) === signature
   * Uses timingSafeEqual to prevent timing attacks.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    try {
      if (!signature) return false;

      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(bodyStr)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
      const receivedBuf = Buffer.from(signature, 'utf-8');

      if (expectedBuf.length !== receivedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch (err) {
      this.logger.warn(`Webhook signature verification error: ${(err as Error).message}`);
      return false;
    }
  }
}
