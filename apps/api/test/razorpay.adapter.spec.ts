import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RazorpayAdapter } from '../src/modules/payments/razorpay.adapter';

describe('RazorpayAdapter', () => {
  let adapter: RazorpayAdapter;
  const keyId = 'rzp_test_key123';
  const keySecret = 'rzp_secret_secret456';
  const webhookSecret = 'rzp_webhook_secret789';

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'RAZORPAY_KEY_ID') return keyId;
        if (key === 'RAZORPAY_KEY_SECRET') return keySecret;
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return webhookSecret;
        return defaultValue;
      }),
    } as unknown as ConfigService;

    adapter = new RazorpayAdapter(configService);
  });

  describe('Key Exposer', () => {
    it('exposes only keyId, never keySecret', () => {
      expect(adapter.getKeyId()).toBe(keyId);
      expect((adapter as any).keySecret).toBe(keySecret);
    });
  });

  describe('Payment Signature Verification', () => {
    it('verifies valid payment signature using timingSafeEqual', () => {
      const orderId = 'order_DA12345';
      const paymentId = 'pay_BC67890';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');

      const isValid = adapter.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it('rejects invalid or tampered payment signature', () => {
      const orderId = 'order_DA12345';
      const paymentId = 'pay_BC67890';

      const isInvalid = adapter.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: 'invalid_hex_signature_abcdef',
      });

      expect(isInvalid).toBe(false);
    });
  });

  describe('Webhook Signature Verification', () => {
    it('verifies valid webhook signature with webhook secret', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } });
      const validSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      const isValid = adapter.verifyWebhookSignature(rawBody, validSignature);
      expect(isValid).toBe(true);
    });

    it('rejects tampered webhook body or wrong signature', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured' });
      const invalidSignature = 'tampered_signature_123456';

      const isValid = adapter.verifyWebhookSignature(rawBody, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('returns false on empty or missing signature', () => {
      const isValid = adapter.verifyWebhookSignature('{}', '');
      expect(isValid).toBe(false);
    });
  });
});
