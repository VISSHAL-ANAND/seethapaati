import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../src/modules/inventory/inventory.service';

describe('InventoryService - Concurrency, Locking & Lifecycle', () => {
  let inventoryService: InventoryService;
  let mockPrisma: any;

  const variantId = 'v1111111-1111-1111-1111-111111111111';
  const reservationId = 'r1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockPrisma = {
      productVariant: {
        findUnique: jest.fn(),
      },
      inventory: {
        upsert: jest.fn(),
      },
      inventoryReservation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    inventoryService = new InventoryService(mockPrisma);
  });

  describe('getInventory', () => {
    it('returns inventory status with availability calculation', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: variantId,
        sku: 'TURM-250G',
        status: 'ACTIVE',
        inventory: {
          quantityAvailable: 100,
          quantityReserved: 15,
          reorderThreshold: 10,
        },
      });

      const result = await inventoryService.getInventory(variantId);

      expect(result.variantId).toBe(variantId);
      expect(result.quantityAvailable).toBe(100);
      expect(result.quantityReserved).toBe(15);
      expect(result.isAvailable).toBe(true);
    });

    it('throws NotFoundException if variant does not exist', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(inventoryService.getInventory(variantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reserve', () => {
    it('successfully acquires row lock and creates reservation when stock is available', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          variant_id: variantId,
          quantity_available: 50,
          quantity_reserved: 10,
          version: 1,
        },
      ]);

      const mockExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      mockPrisma.inventoryReservation.create.mockResolvedValue({
        id: reservationId,
        variantId,
        checkoutSessionId: 'sess_123',
        quantity: 5,
        expiresAt: mockExpiresAt,
        status: 'ACTIVE',
      });

      const result = await inventoryService.reserve({
        variantId,
        quantity: 5,
        checkoutSessionId: 'sess_123',
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(result.reservationId).toBe(reservationId);
      expect(result.quantity).toBe(5);
    });

    it('rejects reservation with ConflictException when requested quantity exceeds available stock', async () => {
      // 50 total, 48 reserved -> only 2 available
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          variant_id: variantId,
          quantity_available: 50,
          quantity_reserved: 48,
          version: 1,
        },
      ]);

      await expect(
        inventoryService.reserve({
          variantId,
          quantity: 5, // requests 5, only 2 available
          checkoutSessionId: 'sess_123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects non-positive reservation quantities', async () => {
      await expect(
        inventoryService.reserve({
          variantId,
          quantity: 0,
          checkoutSessionId: 'sess_123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('commitReservation', () => {
    it('commits active reservation and records inventory movement ledger', async () => {
      mockPrisma.inventoryReservation.findUnique.mockResolvedValue({
        id: reservationId,
        variantId,
        quantity: 3,
        status: 'ACTIVE',
      });
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({ count: 1 });

      await inventoryService.commitReservation(reservationId);

      expect(mockPrisma.inventoryReservation.updateMany).toHaveBeenCalledWith({
        where: { id: reservationId, status: 'ACTIVE' },
        data: { status: 'COMMITTED' },
      });
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: {
          variantId,
          delta: -3,
          reason: 'SALE_COMMITTED',
          referenceId: reservationId,
        },
      });
    });

    it('rejects commit if reservation is not found in database', async () => {
      mockPrisma.inventoryReservation.findUnique.mockResolvedValue(null);

      await expect(inventoryService.commitReservation(reservationId)).rejects.toThrow(NotFoundException);
    });

    it('rejects commit if atomic status update returns count 0 (race condition or not ACTIVE)', async () => {
      mockPrisma.inventoryReservation.findUnique.mockResolvedValue({
        id: reservationId,
        variantId,
        quantity: 3,
        status: 'EXPIRED',
      });
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({ count: 0 });

      await expect(inventoryService.commitReservation(reservationId)).rejects.toThrow(ConflictException);
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    it('cancels active reservation and releases reserved count back to pool', async () => {
      mockPrisma.inventoryReservation.findUnique.mockResolvedValue({
        id: reservationId,
        variantId,
        quantity: 4,
        status: 'ACTIVE',
      });
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({ count: 1 });

      await inventoryService.cancelReservation(reservationId);

      expect(mockPrisma.inventoryReservation.updateMany).toHaveBeenCalledWith({
        where: { id: reservationId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('is idempotent if reservation is already cancelled or expired (atomic update count 0)', async () => {
      mockPrisma.inventoryReservation.findUnique.mockResolvedValue({
        id: reservationId,
        variantId,
        quantity: 4,
        status: 'EXPIRED',
      });
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({ count: 0 });

      await inventoryService.cancelReservation(reservationId);

      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('expireStaleReservations', () => {
    it('expires stale active reservations inside transaction and returns exact count', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([
        {
          id: 'res_1',
          variantId,
          quantity: 2,
        },
        {
          id: 'res_2',
          variantId,
          quantity: 3,
        },
      ]);

      // Both transition successfully
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({
        count: 1,
      });

      const count = await inventoryService.expireStaleReservations();

      expect(count).toBe(2);
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(mockPrisma.inventoryReservation.updateMany).toHaveBeenCalledWith({
        where: { id: 'res_1', status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
      expect(mockPrisma.inventoryReservation.updateMany).toHaveBeenCalledWith({
        where: { id: 'res_2', status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
    });

    it('handles race conditions by only releasing inventory when atomic update count is 1', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res_1', variantId, quantity: 2 },
        { id: 'res_2', variantId, quantity: 3 }, // concurrently committed
      ]);

      // res_1 succeeds (count: 1), res_2 fails because it was already committed (count: 0)
      mockPrisma.inventoryReservation.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const count = await inventoryService.expireStaleReservations();

      expect(count).toBe(1);
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('returns 0 when no reservations have expired', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([]);

      const count = await inventoryService.expireStaleReservations();

      expect(count).toBe(0);
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });
});
