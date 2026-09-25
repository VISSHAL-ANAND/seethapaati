import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { AuthService } from '../src/modules/auth/auth.service';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { RoleName, PermissionName, AuthUser } from '@seethapaati/contracts';

describe('AuthGuard - Permissive & Protected Authentication', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let authService: jest.Mocked<AuthService>;

  const mockUser: AuthUser = {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'user@example.com',
    fullName: 'Test User',
    isEmailVerified: true,
    roles: [RoleName.CUSTOMER],
    permissions: [PermissionName.PRODUCTS_READ],
  };

  const createMockContext = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const request: any = {
      headers,
      cookies,
      user: undefined,
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as any;
    authService = {
      getAuthUser: jest.fn(),
    } as any;

    guard = new AuthGuard(jwtService, reflector, configService, authService);
  });

  describe('@Public() routes (Permissive Authentication)', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });
    });

    it('allows access and leaves request.user undefined when no token is present', async () => {
      const { context, request } = createMockContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('allows access and attaches authenticated user when valid Bearer token is provided', async () => {
      const { context, request } = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      authService.getAuthUser.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', { secret: 'test-secret' });
      expect(authService.getAuthUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('allows access and attaches authenticated user when valid cookie token is provided', async () => {
      const { context, request } = createMockContext({}, { access_token: 'cookie.jwt.token' });

      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      authService.getAuthUser.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie.jwt.token', { secret: 'test-secret' });
    });

    it('does NOT throw UnauthorizedException and falls back to anonymous if token is expired or invalid', async () => {
      const { context, request } = createMockContext({
        authorization: 'Bearer expired.jwt.token',
      });

      jwtService.verifyAsync.mockRejectedValue(new Error('TokenExpiredError'));

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
    });

    it('does NOT throw UnauthorizedException and falls back to anonymous if getAuthUser throws', async () => {
      const { context, request } = createMockContext({
        authorization: 'Bearer valid.token.stale.user',
      });

      jwtService.verifyAsync.mockResolvedValue({ sub: 'deleted-user' });
      authService.getAuthUser.mockRejectedValue(new UnauthorizedException());

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
    });
  });

  describe('Protected routes (Strict Authentication)', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    });

    it('throws UnauthorizedException when no token is provided', async () => {
      const { context } = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token verification fails', async () => {
      const { context } = createMockContext({
        authorization: 'Bearer invalid.token',
      });

      jwtService.verifyAsync.mockRejectedValue(new Error('JsonWebTokenError'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token payload has no sub', async () => {
      const { context } = createMockContext({
        authorization: 'Bearer token.without.sub',
      });

      jwtService.verifyAsync.mockResolvedValue({} as any);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('successfully authenticates and attaches user when valid token is provided', async () => {
      const { context, request } = createMockContext({
        authorization: 'Bearer valid.token',
      });

      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      authService.getAuthUser.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
    });
  });
});
