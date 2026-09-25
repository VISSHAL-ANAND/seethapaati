import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersService - Profile & Address Management', () => {
  let usersService: UsersService;
  let mockPrisma: any;

  const userId = 'u1111111-1111-1111-1111-111111111111';
  const addressId = 'a1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      address: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    usersService = new UsersService(mockPrisma);
  });

  describe('getProfile', () => {
    it('returns user profile data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        fullName: 'Jane Doe',
        phone: '+919876543210',
        isEmailVerified: true,
        createdAt: new Date(),
      });

      const profile = await usersService.getProfile(userId);

      expect(profile.id).toBe(userId);
      expect(profile.fullName).toBe('Jane Doe');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.getProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAddress', () => {
    it('atomically clears existing default and creates new default address in transaction', async () => {
      mockPrisma.address.create.mockResolvedValue({
        id: addressId,
        userId,
        fullName: 'Jane Doe',
        phone: '+919876543210',
        addressLine1: '123 Main St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'IN',
        isDefault: true,
      });

      const result = await usersService.createAddress(userId, {
        fullName: 'Jane Doe',
        phone: '+919876543210',
        addressLine1: '123 Main St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'IN',
        isDefault: true,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isDefault: false },
      });
      expect(mockPrisma.address.create).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });
  });

  describe('updateAddress', () => {
    it('atomically clears other default addresses inside transaction when toggling isDefault', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        id: addressId,
        userId,
        isDefault: false,
      });

      mockPrisma.address.update.mockResolvedValue({
        id: addressId,
        userId,
        isDefault: true,
      });

      await usersService.updateAddress(userId, addressId, { isDefault: true });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    it('rejects updating an address belonging to another user with ForbiddenException', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        id: addressId,
        userId: 'other_user_id',
      });

      await expect(
        usersService.updateAddress(userId, addressId, { fullName: 'Hacker' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAddress', () => {
    it('rejects deleting address belonging to another user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        id: addressId,
        userId: 'other_user_id',
      });

      await expect(usersService.deleteAddress(userId, addressId)).rejects.toThrow(ForbiddenException);
    });

    it('deletes address owned by user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        id: addressId,
        userId,
      });

      const res = await usersService.deleteAddress(userId, addressId);
      expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: addressId } });
      expect(res.message).toBe('Address deleted');
    });
  });
});
