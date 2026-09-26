export interface CreateGatewayOrderParams {
  amountCents: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  gateway: 'RAZORPAY' | 'STRIPE' | 'MOCK';
  amountCents: number;
  currency: string;
}

export interface VerifyPaymentSignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGatewayAdapter {
  createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPaymentSignature(params: VerifyPaymentSignatureParams): boolean;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean;
  getKeyId(): string;
}
