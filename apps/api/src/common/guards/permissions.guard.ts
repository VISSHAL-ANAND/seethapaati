import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionName, RoleName } from '@seethapaati/contracts';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionName[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException({
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to perform this action',
      });
    }

    // Super Admin has all permissions automatically
    if (user.roles?.includes(RoleName.ADMIN)) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenException({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have sufficient permissions to perform this action',
      });
    }

    return true;
  }
}
