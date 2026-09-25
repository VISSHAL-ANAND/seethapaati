import { z } from 'zod';

export const CreateCheckoutIntentRequestSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(8),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default('IN'),
  }),
  couponCode: z.string().trim().optional(),
  idempotencyKey: z.string().uuid(),
});

export type CreateCheckoutIntentRequest = z.infer<typeof CreateCheckoutIntentRequestSchema>;

export const CheckoutIntentResponseSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  amountCents: z.number().int().positive(),
  currency: z.string().default('INR'),
  gateway: z.enum(['RAZORPAY', 'STRIPE', 'MOCK']),
  gatewayOrderId: z.string(),
  gatewayKeyId: z.string(),
});

export type CheckoutIntentResponse = z.infer<typeof CheckoutIntentResponseSchema>;
