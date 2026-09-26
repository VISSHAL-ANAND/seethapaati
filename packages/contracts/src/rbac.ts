export enum RoleName {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum PermissionName {
  // Products
  PRODUCTS_READ = 'products.read',
  PRODUCTS_CREATE = 'products.create',
  PRODUCTS_UPDATE = 'products.update',
  PRODUCTS_DELETE = 'products.delete',

  // Categories
  CATEGORIES_READ = 'categories.read',
  CATEGORIES_MANAGE = 'categories.manage',

  // Inventory
  INVENTORY_READ = 'inventory.read',
  INVENTORY_UPDATE = 'inventory.update',

  // Orders
  ORDERS_READ = 'orders.read',
  ORDERS_READ_ALL = 'orders.read_all',
  ORDERS_UPDATE = 'orders.update',
  ORDERS_REFUND = 'orders.refund',
  SHIPMENTS_MANAGE = 'shipments.manage',
  RETURNS_MANAGE = 'returns.manage',

  // Users & Roles
  USERS_READ = 'users.read',
  USERS_UPDATE = 'users.update',
  ROLES_MANAGE = 'roles.manage',

  // Reports & Settings
  REPORTS_READ = 'reports.read',
  SETTINGS_UPDATE = 'settings.update',
  AUDIT_LOGS_READ = 'audit_logs.read',
}

export const ROLE_DEFAULT_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  [RoleName.CUSTOMER]: [
    PermissionName.PRODUCTS_READ,
    PermissionName.CATEGORIES_READ,
    PermissionName.ORDERS_READ,
  ],
  [RoleName.STAFF]: [
    PermissionName.PRODUCTS_READ,
    PermissionName.CATEGORIES_READ,
    PermissionName.INVENTORY_READ,
    PermissionName.INVENTORY_UPDATE,
    PermissionName.ORDERS_READ_ALL,
    PermissionName.ORDERS_UPDATE,
  ],
  [RoleName.MANAGER]: [
    PermissionName.PRODUCTS_READ,
    PermissionName.PRODUCTS_CREATE,
    PermissionName.PRODUCTS_UPDATE,
    PermissionName.CATEGORIES_READ,
    PermissionName.CATEGORIES_MANAGE,
    PermissionName.INVENTORY_READ,
    PermissionName.INVENTORY_UPDATE,
    PermissionName.ORDERS_READ_ALL,
    PermissionName.ORDERS_UPDATE,
    PermissionName.RETURNS_MANAGE,
    PermissionName.SHIPMENTS_MANAGE,
    PermissionName.ORDERS_REFUND,
    PermissionName.USERS_READ,
    PermissionName.REPORTS_READ,
  ],
  [RoleName.ADMIN]: Object.values(PermissionName),
};
