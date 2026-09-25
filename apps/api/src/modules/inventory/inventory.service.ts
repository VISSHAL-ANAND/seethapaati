import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInventoryRequest } from '@seethapaati/contracts';

export interface ReservationRequest {
  variantId: string;
  quantity: number;
  checkoutSessionId: string;
  ttlMinutes?: number;
}

export interface ReservationResult {
  reservationId: string;
  variantId: string;
  quantity: number;
  expiresAt: Date;
}

const DEFAULT_RESERVATION_TTL_MINUTES = 15;

/**
 * INVENTORY SERVICE
 *
 * Concurrency strategy:
 *   - Reservations use SELECT FOR UPDATE (pessimistic locking via raw SQL)
 *   - Never allow quantity_available to go negative
 *   - Reservation lifecycle: ACTIVE → COMMITTED (paid) or EXPIRED (timeout)
 *   - TTL expiry is handled by the InventoryTtlWorker (BullMQ)
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async getInventory(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    if (!variant) {
      throw new NotFoundException({ error: 'VARIANT_NOT_FOUND', message: 'Variant not found' });
    }

    if (!variant.inventory) {
      throw new NotFoundException({ error: 'INVENTORY_NOT_FOUND', message: 'Inventory record not found for variant' });
    }

    return {
      variantId,
      sku: variant.sku,
      quantityAvailable: variant.inventory.quantityAvailable,
      quantityReserved: variant.inventory.quantityReserved,
      reorderThreshold: variant.inventory.reorderThreshold,
      isAvailable:
        variant.status === 'ACTIVE' &&
        variant.inventory.quantityAvailable > variant.inventory.quantityReserved,
    };
  }

  async updateInventory(variantId: string, dto: UpdateInventoryRequest) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    if (!variant) {
      throw new NotFoundException({ error: 'VARIANT_NOT_FOUND', message: 'Variant not found' });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const prev = variant.inventory;
      const updated = await tx.inventory.upsert({
        where: { variantId },
        create: {
          variantId,
          quantityAvailable: dto.quantityAvailable,
          quantityReserved: 0,
          reorderThreshold: dto.reorderThreshold ?? 5,
        },
        update: {
          quantityAvailable: dto.quantityAvailable,
          ...(dto.reorderThreshold !== undefined && { reorderThreshold: dto.reorderThreshold }),
        },
      });

      const delta = dto.quantityAvailable - (prev?.quantityAvailable ?? 0);
      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId,
            delta,
            reason: 'ADMIN_ADJUSTMENT',
          },
        });
      }

      return updated;
    });

    this.logger.log(`Inventory updated for ${variantId}: available=${result.quantityAvailable}`);
    return result;
  }

  /**
   * Reserve stock for a checkout session.
   * Uses SELECT FOR UPDATE to prevent race conditions.
   * Two concurrent requests for the last unit will be serialized — one succeeds, one gets 409.
   */
  async reserve(req: ReservationRequest): Promise<ReservationResult> {
    const { variantId, quantity, checkoutSessionId, ttlMinutes = DEFAULT_RESERVATION_TTL_MINUTES } = req;

    if (quantity <= 0) {
      throw new BadRequestException({ error: 'INVALID_QUANTITY', message: 'Quantity must be positive' });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // PESSIMISTIC LOCK: SELECT ... FOR UPDATE prevents concurrent modification
      const inventoryRows = await tx.$queryRaw<Array<{
        variant_id: string;
        quantity_available: number;
        quantity_reserved: number;
        version: number;
      }>>`
        SELECT variant_id, quantity_available, quantity_reserved, version
        FROM inventory
        WHERE variant_id = ${variantId}
        FOR UPDATE
      `;

      if (inventoryRows.length === 0) {
        throw new NotFoundException({ error: 'INVENTORY_NOT_FOUND', message: 'Inventory not found for variant' });
      }

      const inv = inventoryRows[0];
      const effectiveAvailable = inv.quantity_available - inv.quantity_reserved;

      if (effectiveAvailable < quantity) {
        throw new ConflictException({
          error: 'INSUFFICIENT_STOCK',
          message: `Only ${effectiveAvailable} unit(s) available. Requested: ${quantity}`,
          available: effectiveAvailable,
        });
      }

      // Update reserved count
      await tx.$executeRaw`
        UPDATE inventory
        SET quantity_reserved = quantity_reserved + ${quantity},
            version = version + 1,
            updated_at = NOW()
        WHERE variant_id = ${variantId}
      `;

      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      const reservation = await tx.inventoryReservation.create({
        data: {
          variantId,
          checkoutSessionId,
          quantity,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      return reservation;
    });

    this.logger.log(
      `Reserved ${quantity} unit(s) of variant ${variantId} for session ${checkoutSessionId}. Expires: ${result.expiresAt.toISOString()}`,
    );

    return {
      reservationId: result.id,
      variantId: result.variantId,
      quantity: result.quantity,
      expiresAt: result.expiresAt,
    };
  }

  /**
   * Commit a reservation after successful payment.
   * Moves quantity from reserved → permanently sold (decrements both reserved and available).
   * Atomically transitions state from ACTIVE → COMMITTED at the DB level to prevent double-commit race conditions.
   */
  async commitReservation(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException({ error: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
      }

      // Atomic transition: ACTIVE -> COMMITTED
      const updateResult = await tx.inventoryReservation.updateMany({
        where: { id: reservationId, status: 'ACTIVE' },
        data: { status: 'COMMITTED' },
      });

      if (updateResult.count === 0) {
        throw new ConflictException({
          error: 'RESERVATION_NOT_ACTIVE',
          message: `Reservation is in state '${reservation.status}', cannot commit`,
        });
      }

      await tx.$executeRaw`
        UPDATE inventory
        SET quantity_available = quantity_available - ${reservation.quantity},
            quantity_reserved = quantity_reserved - ${reservation.quantity},
            version = version + 1,
            updated_at = NOW()
        WHERE variant_id = ${reservation.variantId}
      `;

      await tx.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          delta: -reservation.quantity,
          reason: 'SALE_COMMITTED',
          referenceId: reservationId,
        },
      });
    });

    this.logger.log(`Reservation ${reservationId} committed`);
  }

  /**
   * Cancel/release a reservation (payment failure or user abandonment).
   * Returns quantity back to available pool.
   * Atomically transitions state from ACTIVE → CANCELLED at the DB level to prevent double-release race conditions.
   */
  async cancelReservation(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException({ error: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' });
      }

      // Atomic transition: ACTIVE -> CANCELLED
      const updateResult = await tx.inventoryReservation.updateMany({
        where: { id: reservationId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      if (updateResult.count === 0) {
        // Already expired, committed, or cancelled — idempotent
        return;
      }

      await tx.$executeRaw`
        UPDATE inventory
        SET quantity_reserved = GREATEST(0, quantity_reserved - ${reservation.quantity}),
            version = version + 1,
            updated_at = NOW()
        WHERE variant_id = ${reservation.variantId}
      `;
    });

    this.logger.log(`Reservation ${reservationId} cancelled`);
  }

  /**
   * Expire all reservations that have passed their TTL.
   * Called by the scheduler every 60 seconds.
   * Returns count of expired reservations.
   *
   * TOCTOU safety: Each reservation transition from ACTIVE -> EXPIRED is atomic.
   * Stock is ONLY decremented if the atomic status update succeeded (count === 1).
   */
  async expireStaleReservations(): Promise<number> {
    const expiredCount = await this.prisma.$transaction(async (tx) => {
      const expired = await tx.inventoryReservation.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: new Date() },
        },
      });

      if (expired.length === 0) return 0;

      let releasedCount = 0;
      for (const res of expired) {
        // Atomic transition: ACTIVE -> EXPIRED
        const updateResult = await tx.inventoryReservation.updateMany({
          where: { id: res.id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        // Only release inventory if this transaction successfully transitioned the reservation
        if (updateResult.count === 1) {
          await tx.$executeRaw`
            UPDATE inventory
            SET quantity_reserved = GREATEST(0, quantity_reserved - ${res.quantity}),
                version = version + 1,
                updated_at = NOW()
            WHERE variant_id = ${res.variantId}
          `;
          releasedCount++;
        }
      }

      return releasedCount;
    });

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} stale reservation(s)`);
    }
    return expiredCount;
  }

  async getActiveReservations(variantId: string) {
    return this.prisma.inventoryReservation.findMany({
      where: { variantId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'asc' },
    });
  }
}
