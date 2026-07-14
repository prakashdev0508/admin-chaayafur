import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminBanner,
  CreateBannerPayload,
  HomePayload,
  ListBannersParams,
  UpdateBannerPayload,
} from "@/types/home";

function buildQueryString(params: ListBannersParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function fetchHome() {
  return apiRequest<HomePayload>("/home", {}, false);
}

export function listBanners(params: ListBannersParams = {}) {
  return apiRequest<PaginatedResponse<AdminBanner>>(
    `/admin/home/banners${buildQueryString(params)}`,
  );
}

export function getBanner(id: number) {
  return apiRequest<AdminBanner>(`/admin/home/banners/${id}`);
}

export function createBanner(payload: CreateBannerPayload) {
  return apiRequest<AdminBanner>("/admin/home/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBanner(id: number, payload: UpdateBannerPayload) {
  return apiRequest<AdminBanner>(`/admin/home/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
