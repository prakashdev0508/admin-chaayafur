export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "ORDER_MANAGER";

export type StaffUser = {
  id: number;
  email: string;
  role: StaffRole;
  firstName: string | null;
  lastName: string | null;
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
  label: string;
  permissions: string[];
};

export type RolesPermissionsMap = Record<StaffRole, RolePermissionEntry>;

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
