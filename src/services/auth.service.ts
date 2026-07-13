import { apiRequest } from "@/lib/api";
import type {
  LoginPayload,
  LoginResponse,
  RolesPermissionsMap,
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
