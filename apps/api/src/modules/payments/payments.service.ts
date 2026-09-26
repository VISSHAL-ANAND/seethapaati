import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGateway, PaymentStatus, Prisma } from '@prisma/client';

export interface CreatePaymentDto {
  orderId: string;
  gateway?: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amountCents: number;
  currency?: string;
  idempotencyKey: string;
}

/**
 * PAYMENTS SERVICE
 *
 * Manages Payment records and state transitions.
 * Enforces strict payment state machine:
 *   PENDING -> AUTHORIZED, CAPTURED, FAILED
 *   AUTHORIZED -> CAPTURED, FAILED
 *   CAPTURED -> REFUNDED
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new payment record in PENDING state.
   */
  async createPayment(dto: CreatePaymentDto, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    // Check if payment with idempotencyKey already exists
    const existing = await client.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    return client.payment.create({
      data: {
        orderId: dto.orderId,
        gateway: dto.gateway ?? PaymentGateway.RAZORPAY,
        gatewayOrderId: dto.gatewayOrderId,
        gatewayPaymentId: dto.gatewayPaymentId,
        amountCents: dto.amountCents,
        currency: dto.currency ?? 'INR',
        status: PaymentStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
      },
    });
  }

  async getPaymentByOrderId(orderId: string) {
    return this.prisma.payment.findFirst({
      where: { orderId },
      include: { transactions: true },
    });
  }

  async getPaymentByGatewayOrderId(gatewayOrderId: string) {
    return this.prisma.payment.findUnique({
      where: { gatewayOrderId },
      include: { order: true },
    });
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });
  }

  /**
   * Update payment status with strict state machine validation and atomic transition.
   */
  async transitionStatus(
    paymentId: string,
    newStatus: PaymentStatus,
    gatewayPaymentId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const payment = await client.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException({ error: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' });
    }

    // Define valid state transitions
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED, PaymentStatus.FAILED],
      [PaymentStatus.AUTHORIZED]: [PaymentStatus.CAPTURED, PaymentStatus.FAILED],
      [PaymentStatus.CAPTURED]: [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]: [],
      [PaymentStatus.REFUNDED]: [],
    };

    if (payment.status === newStatus) {
      // Idempotent transition: already in target state
      return payment;
    }

    const allowed = validTransitions[payment.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ConflictException({
        error: 'INVALID_PAYMENT_TRANSITION',
        message: `Cannot transition payment from ${payment.status} to ${newStatus}`,
      });
    }

    // Atomic update
    const updateResult = await client.payment.updateMany({
      where: { id: paymentId, status: payment.status },
      data: {
        status: newStatus,
        ...(gatewayPaymentId && { gatewayPaymentId }),
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException({
        error: 'CONCURRENT_PAYMENT_UPDATE',
        message: 'Payment state was modified concurrently',
      });
    }

    this.logger.log(`Payment ${paymentId} transitioned: ${payment.status} -> ${newStatus}`);

    return client.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });
  }

  /**
   * Record raw gateway event payload in PaymentTransaction ledger.
   */
  async recordTransaction(
    paymentId: string,
    eventType: string,
    payload: any,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.paymentTransaction.create({
      data: {
        paymentId,
        eventType,
        payload,
      },
    });
  }
}
