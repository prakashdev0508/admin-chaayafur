import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateMediaItemPayload,
  CreateMediaVendorPayload,
  ListMediaItemsParams,
  ListMediaVendorsParams,
  MediaItem,
  MediaVendor,
  UpdateMediaItemPayload,
  UpdateMediaVendorPayload,
} from "@/types/media";

function buildQueryString(
  params: ListMediaVendorsParams | ListMediaItemsParams,
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listMediaVendors(params: ListMediaVendorsParams = {}) {
  return apiRequest<PaginatedResponse<MediaVendor>>(
    `/admin/media/vendors${buildQueryString(params)}`,
  );
}

export function getMediaVendor(id: number) {
  return apiRequest<MediaVendor>(`/admin/media/vendors/${id}`);
}

export function createMediaVendor(payload: CreateMediaVendorPayload) {
  return apiRequest<MediaVendor>("/admin/media/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMediaVendor(
  id: number,
  payload: UpdateMediaVendorPayload,
) {
  return apiRequest<MediaVendor>(`/admin/media/vendors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMediaVendor(id: number) {
  return apiRequest<void>(`/admin/media/vendors/${id}`, {
    method: "DELETE",
  });
}

export function listMediaItems(params: ListMediaItemsParams = {}) {
  return apiRequest<PaginatedResponse<MediaItem>>(
    `/admin/media${buildQueryString(params)}`,
  );
}

export function getMediaItem(id: number) {
  return apiRequest<MediaItem>(`/admin/media/${id}`);
}

export function createMediaItem(payload: CreateMediaItemPayload) {
  return apiRequest<MediaItem>("/admin/media", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMediaItem(id: number, payload: UpdateMediaItemPayload) {
  return apiRequest<MediaItem>(`/admin/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMediaItem(id: number) {
  return apiRequest<void>(`/admin/media/${id}`, {
    method: "DELETE",
  });
}
