/**
 * Permission codes used by the admin area.
 * Roles get permissions through the `role_permissions` table (see seed).
 * The `admin` role (Super Admin) always passes every permission check.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  PRODUCT_READ: 'product.read',
  PRODUCT_WRITE: 'product.write',
  CATEGORY_WRITE: 'category.write',
  ORDER_READ: 'order.read',
  ORDER_UPDATE: 'order.update',
  PAYMENT_CONFIRM: 'payment.confirm',
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_MANAGE: 'customer.manage',
  INVENTORY_MANAGE: 'inventory.manage',
  COUPON_MANAGE: 'coupon.manage',
  CONTENT_MANAGE: 'content.manage',
  REVIEW_MODERATE: 'review.moderate',
  REPORT_VIEW: 'report.view',
  USER_MANAGE: 'user.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SUPER_ADMIN_ROLE = 'admin';
export const STAFF_ROLES = ['admin', 'staff_sales', 'staff_warehouse', 'staff_support'];
