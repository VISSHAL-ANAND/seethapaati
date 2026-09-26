import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from '../src/modules/orders/orders.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { OrderStatus } from '@seethapaati/contracts';

describe('OrdersService - Queries, Transitions & RBAC', () => {
  let service: OrdersService;
  let prisma: any;
  let inventoryService: any;

  const userId = 'u1111111-1111-1111-1111-111111111111';
  const orderId = 'o1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
    };

    inventoryService = {
      cancelReservationsBySession: jest.fn().mockResolvedValue(1),
    };

    service = new OrdersService(
      prisma as unknown as PrismaService,
      inventoryService as unknown as InventoryService,
    );
  });

  describe('getOrdersForUser', () => {
    it('returns paginated orders filtered by userId', async () => {
      prisma.order.findMany.mockResolvedValue([
        { id: orderId, userId, orderNumber: 'SP-000001', status: OrderStatus.PAID },
      ]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.getOrdersForUser(userId, { page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        }),
      );
    });
  });

  describe('getOrderById (IDOR Isolation)', () => {
    it('returns order when requested by its owner', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        orderNumber: 'SP-000001',
      });

      const order = await service.getOrderById(orderId, userId, false);
      expect(order.id).toBe(orderId);
    });

    it('returns order for staff even if not owned', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'different_user',
        orderNumber: 'SP-000001',
      });

      const order = await service.getOrderById(orderId, userId, true);
      expect(order.id).toBe(orderId);
    });

    it('throws ForbiddenException if customer tries to access another users order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'different_user',
        orderNumber: 'SP-000001',
      });

      await expect(service.getOrderById(orderId, userId, false)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.getOrderById(orderId, userId, false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrderStatus (State Machine Enforcement)', () => {
    it('allows valid transition PAID -> PROCESSING and logs status history', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.PAID,
      });
      prisma.order.update.mockResolvedValue({
        id: orderId,
        status: OrderStatus.PROCESSING,
      });

      const updated = await service.updateOrderStatus(
        orderId,
        { status: OrderStatus.PROCESSING, reason: 'Picked from shelf' },
        'staff_123',
      );

      expect(updated.status).toBe(OrderStatus.PROCESSING);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId,
          oldStatus: OrderStatus.PAID,
          newStatus: OrderStatus.PROCESSING,
          reason: 'Picked from shelf',
          changedBy: 'staff_123',
        },
      });
    });

    it('cancels reservations when transitioning from PENDING_PAYMENT to CANCELLED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.PENDING_PAYMENT,
      });
      prisma.order.update.mockResolvedValue({
        id: orderId,
        status: OrderStatus.CANCELLED,
      });

      await service.updateOrderStatus(
        orderId,
        { status: OrderStatus.CANCELLED },
        'staff_123',
      );

      // Verifies MED-NEW-02: cancelReservationsBySession receives tx
      expect(inventoryService.cancelReservationsBySession).toHaveBeenCalledWith(orderId, prisma);
    });

    it('rejects invalid state transition PENDING_PAYMENT -> DELIVERED with ConflictException', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.PENDING_PAYMENT,
      });

      await expect(
        service.updateOrderStatus(orderId, { status: OrderStatus.DELIVERED }, 'staff_123'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects transition from terminal state CANCELLED -> PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.updateOrderStatus(orderId, { status: OrderStatus.PAID }, 'staff_123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelOrder (Customer Cancellation)', () => {
    it('allows customer to cancel their own PENDING_PAYMENT order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        status: OrderStatus.PENDING_PAYMENT,
      });
      prisma.order.update.mockResolvedValue({
        id: orderId,
        status: OrderStatus.CANCELLED,
      });

      const updated = await service.cancelOrder(orderId, userId, 'Changed mind');

      expect(updated.status).toBe(OrderStatus.CANCELLED);
      // Verifies MED-NEW-02: cancelReservationsBySession receives tx
      expect(inventoryService.cancelReservationsBySession).toHaveBeenCalledWith(orderId, prisma);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId,
          oldStatus: OrderStatus.PENDING_PAYMENT,
          newStatus: OrderStatus.CANCELLED,
          reason: 'Changed mind',
          changedBy: userId,
        },
      });
    });

    it('rejects customer cancellation if order is already PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        status: OrderStatus.PAID,
      });

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancellation if user is not the order owner', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'other_user',
        status: OrderStatus.PENDING_PAYMENT,
      });

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
