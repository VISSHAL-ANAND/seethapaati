import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { PermissionName, RoleName } from '@seethapaati/contracts';

describe('PermissionsGuard - Authorization Enforcement', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext);

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access if route has no required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ id: '1', roles: [RoleName.CUSTOMER] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow super ADMIN access to any protected route', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionName.PRODUCTS_CREATE, PermissionName.SETTINGS_UPDATE]);

    const context = createMockContext({
      id: '1',
      roles: [RoleName.ADMIN],
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user possessing all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionName.PRODUCTS_READ, PermissionName.CATEGORIES_READ]);

    const context = createMockContext({
      id: '2',
      roles: [RoleName.CUSTOMER],
      permissions: [PermissionName.PRODUCTS_READ, PermissionName.CATEGORIES_READ],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks a required permission (e.g. after demotion)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionName.PRODUCTS_CREATE]);

    // Customer trying to access manager route
    const context = createMockContext({
      id: '3',
      roles: [RoleName.CUSTOMER],
      permissions: [PermissionName.PRODUCTS_READ],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user object is not present', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionName.PRODUCTS_READ]);

    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
