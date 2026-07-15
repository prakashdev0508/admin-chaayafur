import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  LoginPayload,
  LoginResponse,
  RolesPermissionsMap,
  StaffUser,
  StaffListItem,
  StaffProfile,
  StaffMePermissions,
  ListStaffParams,
  UpdateOwnStaffPayload,
  UpdateOwnPasswordPayload,
  UpdateStaffPayload,
  ResetStaffPasswordPayload,
  AuthRole,
  CreateAuthRolePayload,
  UpdateAuthRolePayload,
} from "@/types/auth";

export function loginStaff(payload: LoginPayload) {
  return apiRequest<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false,
  );
}

export function fetchRolesPermissions() {
  return apiRequest<RolesPermissionsMap>("/auth/roles-permissions");
}

export function getStaffMePermissions() {
  return apiRequest<StaffMePermissions>("/auth/staff/me/permissions");
}

export async function listAssignablePermissions() {
  const data = await apiRequest<
    string[] | Array<{ key: string; name?: string }>
  >("/auth/permissions");
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (typeof item === "string" ? item : item.key))
    .filter(Boolean);
}

export async function listRoles() {
  const data = await apiRequest<AuthRole[] | { items: AuthRole[] }>(
    "/auth/roles",
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export function getRole(id: number) {
  return apiRequest<AuthRole>(`/auth/roles/${id}`);
}

export function createRole(payload: CreateAuthRolePayload) {
  return apiRequest<AuthRole>("/auth/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRole(id: number, payload: UpdateAuthRolePayload) {
  return apiRequest<AuthRole>(`/auth/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRole(id: number) {
  return apiRequest<{ message?: string }>(`/auth/roles/${id}`, {
    method: "DELETE",
  });
}

export function listStaff(params: ListStaffParams = {}) {
  return apiRequest<PaginatedResponse<StaffListItem>>(
    `/auth/staff${buildQueryString(params)}`,
  );
}

export type CreateStaffPayload = {
  email: string;
  password: string;
  roleId: number;
  firstName?: string;
  lastName?: string;
};

export function createStaff(payload: CreateStaffPayload) {
  return apiRequest<StaffUser>("/auth/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getStaffMe() {
  return apiRequest<StaffProfile>("/auth/staff/me");
}

export function updateStaffMe(payload: UpdateOwnStaffPayload) {
  return apiRequest<StaffProfile>("/auth/staff/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateStaffMePassword(payload: UpdateOwnPasswordPayload) {
  return apiRequest<{ message?: string }>("/auth/staff/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getStaff(id: number) {
  return apiRequest<StaffProfile>(`/auth/staff/${id}`);
}

export function updateStaff(id: number, payload: UpdateStaffPayload) {
  return apiRequest<StaffProfile>(`/auth/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function resetStaffPassword(
  id: number,
  payload: ResetStaffPasswordPayload,
) {
  return apiRequest<{ message?: string }>(`/auth/staff/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
