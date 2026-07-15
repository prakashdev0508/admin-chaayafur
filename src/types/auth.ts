/** System role slug that cannot be assigned or have permissions edited. */
export const SUPER_ADMIN_SLUG = "SUPER_ADMIN";

export type StaffUser = {
  id: number;
  email: string;
  /** Role slug (system or custom) */
  role: string;
  roleId?: number;
  roleSlug?: string;
  roleName?: string;
  firstName: string | null;
  lastName: string | null;
};

export type StaffCreator = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type StaffActivityStats = {
  ordersConfirmed: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersCancelled: number;
  refundsInitiatedStatus: number;
  refundsInitiated: number;
  refundsCompleted: number;
  refundsProcessedAmount: string | number;
};

export type StaffListItem = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  roleId?: number;
  roleSlug?: string;
  roleName?: string;
  isActive: boolean;
  createdBy: number | null;
  creator: StaffCreator | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /auth/staff/me and GET /auth/staff/:id */
export type StaffProfile = StaffListItem & {
  stats: StaffActivityStats;
};

export type UpdateOwnStaffPayload = {
  firstName?: string | null;
  lastName?: string | null;
};

export type UpdateOwnPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type UpdateStaffPayload = {
  firstName?: string | null;
  lastName?: string | null;
  roleId?: number;
  isActive?: boolean;
};

export type ResetStaffPasswordPayload = {
  newPassword: string;
};

export type ListStaffParams = {
  page?: number;
  limit?: number;
  roleId?: number;
  roleSlug?: string;
  isActive?: boolean;
  email?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: StaffUser;
};

export type RolePermissionEntry = {
  id?: number;
  label: string;
  description?: string | null;
  isSystem?: boolean;
  permissions: string[];
};

/** GET /auth/roles-permissions — keyed by role slug */
export type RolesPermissionsMap = Record<string, RolePermissionEntry>;

/** GET /auth/staff/me/permissions */
export type StaffMePermissions = {
  roleId: number;
  role: string;
  roleSlug: string;
  permissions: string[];
};

export type AuthRole = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  staffCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAuthRolePayload = {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
};

export type UpdateAuthRolePayload = {
  name?: string;
  description?: string | null;
  permissions?: string[];
};

export type AuthSession = {
  accessToken: string;
  user: StaffUser;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  path?: string;
  timestamp?: string;
};
