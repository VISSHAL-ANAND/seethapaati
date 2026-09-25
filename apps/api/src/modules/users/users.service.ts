import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@seethapaati/contracts';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileRequest) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    this.logger.log(`Profile updated for user ${userId}`);
    return user;
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressRequest) {
    const address = await this.prisma.$transaction(async (tx) => {
      // If marking as default, clear existing default first (atomic with create)
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          fullName: dto.fullName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          isDefault: dto.isDefault ?? false,
        },
      });
    });

    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressRequest) {
    const existing = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing) {
      throw new NotFoundException({ error: 'ADDRESS_NOT_FOUND', message: 'Address not found' });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException({ error: 'ACCESS_DENIED', message: 'Not your address' });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing) {
      throw new NotFoundException({ error: 'ADDRESS_NOT_FOUND', message: 'Address not found' });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException({ error: 'ACCESS_DENIED', message: 'Not your address' });
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }
}
