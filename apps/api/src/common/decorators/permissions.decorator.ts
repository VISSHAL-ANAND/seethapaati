import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '@seethapaati/contracts';

export const PERMISSIONS_KEY = 'permissions';

/** Primary decorator — use this in new controllers */
export const Permissions = (...permissions: PermissionName[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Alias kept for backward compatibility */
export const RequirePermissions = Permissions;
