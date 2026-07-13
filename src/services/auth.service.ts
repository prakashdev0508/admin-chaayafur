import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  LoginPayload,
  LoginResponse,
  RolesPermissionsMap,
  AssignableStaffRole,
  StaffUser,
  StaffListItem,
  ListStaffParams,
} from "@/types/auth";

export function loginStaff(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function fetchRolesPermissions() {
  return apiRequest<RolesPermissionsMap>("/auth/roles-permissions");
}

export function listStaff(params: ListStaffParams = {}) {
  return apiRequest<PaginatedResponse<StaffListItem>>(
    `/auth/staff${buildQueryString(params)}`,
  );
}

export type CreateStaffPayload = {
  email: string;
  password: string;
  role: AssignableStaffRole;
  firstName?: string;
  lastName?: string;
};

export function createStaff(payload: CreateStaffPayload) {
  return apiRequest<StaffUser>("/auth/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
