import { ConflictException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('InventoryService - Batch Reservations (reserveBatch)', () => {
  let service: InventoryService;
  let prisma: any;
  let configService: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      inventoryReservation: {
        create: jest.fn(({ data }: any) => ({
          id: `res-${data?.variantId ?? '1'}`,
          variantId: data?.variantId,
          quantity: data?.quantity,
          expiresAt: data?.expiresAt,
          status: 'ACTIVE',
        })),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'RESERVATION_TTL_MINUTES') return 15;
        return undefined;
      }),
    };

    service = new InventoryService(prisma as unknown as PrismaService, configService as unknown as ConfigService);
  });

  describe('Validation & Limits', () => {
    it('rejects empty batch with BadRequestException', async () => {
      await expect(service.reserveBatch({ items: [], checkoutSessionId: 'sess_1' }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects non-positive quantity with BadRequestException', async () => {
      await expect(
        service.reserveBatch({
          items: [{ variantId: 'v1', quantity: 0 }],
          checkoutSessionId: 'sess_1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects more than 20 distinct variants', async () => {
      const items = Array.from({ length: 21 }, (_, i) => ({
        variantId: `variant-${i + 1}`,
        quantity: 1,
      }));

      await expect(
        service.reserveBatch({ items, checkoutSessionId: 'sess_1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Deterministic Ordering & All-or-Nothing', () => {
    it('aggregates duplicate variants and locks them in sorted variantId order', async () => {
      // Input has v2 before v1 and duplicate v2
      const items = [
        { variantId: 'v2', quantity: 2 },
        { variantId: 'v1', quantity: 3 },
        { variantId: 'v2', quantity: 1 },
      ];

      const lockOrder: string[] = [];

      prisma.$queryRaw.mockImplementation((queryParts: TemplateStringsArray, ...args: any[]) => {
        const variantId = args[0];
        lockOrder.push(variantId);
        return [
          {
            variant_id: variantId,
            quantity_available: 20,
            quantity_reserved: 0,
            version: 1,
          },
        ];
      });

      prisma.inventoryReservation.create.mockImplementation(({ data }: any) => ({
        id: `res-${data.variantId}`,
        variantId: data.variantId,
        quantity: data.quantity,
        expiresAt: data.expiresAt,
        status: 'ACTIVE',
      }));

      const result = await service.reserveBatch({ items, checkoutSessionId: 'sess_sorted' });

      // Verifies deterministic ordering: v1 was locked BEFORE v2 despite input order [v2, v1, v2]
      expect(lockOrder).toEqual(['v1', 'v2']);
      expect(result.reservations).toHaveLength(2);
      expect(result.reservations[0]).toEqual({
        reservationId: 'res-v1',
        variantId: 'v1',
        quantity: 3,
        expiresAt: expect.any(Date),
      });
      // Aggregated quantity for v2 is 2 + 1 = 3
      expect(result.reservations[1]).toEqual({
        reservationId: 'res-v2',
        variantId: 'v2',
        quantity: 3,
        expiresAt: expect.any(Date),
      });
    });

    it('rolls back and throws ConflictException if any single item has insufficient stock', async () => {
      const items = [
        { variantId: 'v1', quantity: 2 },
        { variantId: 'v2', quantity: 10 }, // v2 will not have enough stock
      ];

      prisma.$queryRaw.mockImplementation((_queryParts: any, ...args: any[]) => {
        const variantId = args[0];
        if (variantId === 'v1') {
          return [{ variant_id: 'v1', quantity_available: 5, quantity_reserved: 0, version: 1 }];
        }
        if (variantId === 'v2') {
          return [{ variant_id: 'v2', quantity_available: 5, quantity_reserved: 0, version: 1 }]; // only 5 available, 10 requested!
        }
        return [];
      });

      await expect(
        service.reserveBatch({ items, checkoutSessionId: 'sess_insufficient' }),
      ).rejects.toThrow(ConflictException);

      // Verify no reservation created for v2
      expect(prisma.inventoryReservation.create).toHaveBeenCalledTimes(1); // v1 was processed before v2 failed, but inside transaction it rolls back!
    });

    it('MED-NEW-03: executes on provided txClient directly without starting a detached transaction', async () => {
      const mockTx: any = {
        $queryRaw: jest.fn().mockResolvedValue([
          { variant_id: 'v1', quantity_available: 10, quantity_reserved: 0, version: 1 },
        ]),
        $executeRaw: jest.fn().mockResolvedValue(1),
        inventoryReservation: {
          create: jest.fn().mockResolvedValue({
            id: 'res-tx',
            variantId: 'v1',
            quantity: 2,
            expiresAt: new Date(),
            status: 'ACTIVE',
          }),
        },
      };

      const result = await service.reserveBatch(
        { items: [{ variantId: 'v1', quantity: 2 }], checkoutSessionId: 'sess_tx' },
        mockTx,
      );

      expect(result.reservations).toHaveLength(1);
      expect(mockTx.$queryRaw).toHaveBeenCalled();
      expect(mockTx.$executeRaw).toHaveBeenCalled();
      expect(mockTx.inventoryReservation.create).toHaveBeenCalled();
      // Verifies prisma.$transaction was NOT called when txClient was provided!
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('commitReservationsBySession', () => {
    it('commits all active reservations for a session and logs inventory movements', async () => {
      prisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res_1', variantId: 'v1', quantity: 2, status: 'ACTIVE' },
        { id: 'res_2', variantId: 'v2', quantity: 3, status: 'ACTIVE' },
      ]);
      prisma.inventoryReservation.updateMany.mockResolvedValue({ count: 1 });

      const count = await service.commitReservationsBySession('sess_100');

      expect(count).toBe(2);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(2);
    });

    it('returns 0 when no active reservations are found for the session', async () => {
      prisma.inventoryReservation.findMany.mockResolvedValue([]);
      const count = await service.commitReservationsBySession('sess_empty');
      expect(count).toBe(0);
    });
  });

  describe('cancelReservationsBySession', () => {
    it('cancels all active reservations and releases reserved inventory', async () => {
      prisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res_1', variantId: 'v1', quantity: 2, status: 'ACTIVE' },
      ]);
      prisma.inventoryReservation.updateMany.mockResolvedValue({ count: 1 });

      const count = await service.cancelReservationsBySession('sess_100');

      expect(count).toBe(1);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
