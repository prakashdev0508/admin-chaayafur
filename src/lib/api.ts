import { getAccessToken } from "@/lib/auth-storage";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/auth";

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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
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
