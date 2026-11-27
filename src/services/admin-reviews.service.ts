import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminReview,
  CreateAdminReviewPayload,
  ListAdminReviewsParams,
  UpdateAdminReviewPayload,
} from "@/types/admin-review";

function buildQuery(params: ListAdminReviewsParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listAdminReviews(params: ListAdminReviewsParams = {}) {
  return apiRequest<PaginatedResponse<AdminReview>>(
    `/admin/reviews${buildQuery(params)}`,
  );
}

export function getAdminReview(id: number) {
  return apiRequest<AdminReview>(`/admin/reviews/${id}`);
}

export function createAdminReview(payload: CreateAdminReviewPayload) {
  return apiRequest<AdminReview>("/admin/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminReview(
  id: number,
  payload: UpdateAdminReviewPayload,
) {
  return apiRequest<AdminReview>(`/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminReview(id: number) {
  return apiRequest<void>(`/admin/reviews/${id}`, {
    method: "DELETE",
  });
}
