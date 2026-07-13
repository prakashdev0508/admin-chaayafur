import { getAccessToken } from "@/lib/auth-storage";
import { getCustomerAccessToken } from "@/lib/customer-auth-storage";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/auth";

export type AuthMode = "staff" | "customer" | false;

function resolveAuthMode(auth: AuthMode | boolean): AuthMode {
  if (auth === true) return "staff";
  if (auth === false) return false;
  return auth;
}

function getTokenForAuthMode(authMode: AuthMode) {
  if (authMode === "staff") return getAccessToken();
  if (authMode === "customer") return getCustomerAccessToken();
  return null;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function getBaseUrl() {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  if (!baseUrl) {
    throw new Error("VITE_BASE_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
}

export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  auth: AuthMode | boolean = "staff",
): Promise<T> {
  const headers = new Headers();
  const authMode = resolveAuthMode(auth);
  const token = getTokenForAuthMode(authMode);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message =
      "message" in payload ? payload.message : "Something went wrong";
    const statusCode =
      "statusCode" in payload ? payload.statusCode : response.status;
    throw new ApiError(message, statusCode);
  }

  return payload.data;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth: AuthMode | boolean = "staff",
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const authMode = resolveAuthMode(auth);
  if (authMode) {
    const token = getTokenForAuthMode(authMode);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message =
      "message" in payload ? payload.message : "Something went wrong";
    const statusCode =
      "statusCode" in payload ? payload.statusCode : response.status;
    throw new ApiError(message, statusCode);
  }

  return payload.data;
}
