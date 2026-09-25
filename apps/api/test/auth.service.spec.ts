import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { RoleName, PermissionName, ROLE_DEFAULT_PERMISSIONS } from '@seethapaati/contracts';

describe('AuthService - Lightweight JWT & Dynamic Permissions', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockHashing: any;
  let mockJwtService: any;
  let mockConfigService: any;

  const mockUser = {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'test@atelier.com',
    fullName: 'Test User',
    passwordHash: 'hashed_password',
    phone: null,
    isEmailVerified: true,
    userRoles: [
      {
        role: {
          name: RoleName.CUSTOMER,
        },
      },
    ],
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const redisStore = new Map<string, string>();
    mockRedis = {
      get: jest.fn(async (key: string) => redisStore.get(key) || null),
      set: jest.fn(async (key: string, val: string) => {
        redisStore.set(key, val);
      }),
      del: jest.fn(async (key: string) => {
        redisStore.delete(key);
      }),
    };

    mockHashing = {
      hash: jest.fn().mockResolvedValue('hashed_password'),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockJwtService = {
      signAsync: jest.fn().mockImplementation(async (payload) => `signed_jwt_${JSON.stringify(payload)}`),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    authService = new AuthService(
      mockPrisma,
      mockRedis,
      mockHashing,
      mockJwtService,
      mockConfigService,
    );
  });

  describe('JWT Payload Minimization (Fix 1)', () => {
    it('should sign JWT with ONLY sub and email, never embedding roles or permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await authService.login({
        email: 'test@atelier.com',
        password: 'Password123!',
      });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      // Verify signAsync argument does NOT contain roles or permissions
      const signedPayload = mockJwtService.signAsync.mock.calls[0][0];
      expect(signedPayload.roles).toBeUndefined();
      expect(signedPayload.permissions).toBeUndefined();
      expect(signedPayload.sub).toBe(mockUser.id);
      expect(signedPayload.email).toBe(mockUser.email);

      // But response.user contains full AuthUser for client hydration
      expect(response.user.roles).toContain(RoleName.CUSTOMER);
      expect(response.user.permissions).toEqual(ROLE_DEFAULT_PERMISSIONS[RoleName.CUSTOMER]);
    });
  });

  describe('Dynamic Role & Permission Resolution (Fix 1)', () => {
    it('should resolve fresh permissions from DB on cache miss and cache the result', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const authUser = await authService.getAuthUser(mockUser.id);

      expect(authUser.id).toBe(mockUser.id);
      expect(authUser.roles).toEqual([RoleName.CUSTOMER]);
      expect(authUser.permissions).toEqual(ROLE_DEFAULT_PERMISSIONS[RoleName.CUSTOMER]);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `auth:user:${mockUser.id}`,
        expect.any(String),
        120,
      );
    });

    it('should immediately reflect role promotion when cache is invalidated', async () => {
      // 1. Initial state: CUSTOMER
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      const initialAuth = await authService.getAuthUser(mockUser.id);
      expect(initialAuth.roles).toEqual([RoleName.CUSTOMER]);
      expect(initialAuth.permissions).not.toContain(PermissionName.PRODUCTS_CREATE);

      // 2. Role promoted in DB to MANAGER
      const promotedUser = {
        ...mockUser,
        userRoles: [{ role: { name: RoleName.MANAGER } }],
      };
      mockPrisma.user.findUnique.mockResolvedValueOnce(promotedUser);

      // 3. Cache invalidated
      await authService.invalidateUserAuthCache(mockUser.id);
      expect(mockRedis.del).toHaveBeenCalledWith(`auth:user:${mockUser.id}`);

      // 4. Next request immediately receives MANAGER permissions (no 7-day stale window!)
      const updatedAuth = await authService.getAuthUser(mockUser.id);
      expect(updatedAuth.roles).toEqual([RoleName.MANAGER]);
      expect(updatedAuth.permissions).toContain(PermissionName.PRODUCTS_CREATE);
      expect(updatedAuth.permissions).toContain(PermissionName.INVENTORY_UPDATE);
    });

    it('should throw UnauthorizedException when user account is deleted from DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getAuthUser('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
