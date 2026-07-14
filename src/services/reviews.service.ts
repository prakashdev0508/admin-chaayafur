import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateOrderReviewPayload,
  CreateProductReviewPayload,
  ListReviewsParams,
  MyReviewsResponse,
  OrderReview,
  ProductReview,
  PublicProductReviewsResponse,
  UpdateOrderReviewPayload,
  UpdateProductReviewPayload,
  UpdateReviewVisibilityPayload,
} from "@/types/review";

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Customer: create or upsert product review */
export function createProductReview(payload: CreateProductReviewPayload) {
  return apiRequest<ProductReview>(
    "/reviews/products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function updateProductReview(
  id: number,
  payload: UpdateProductReviewPayload,
) {
  return apiRequest<ProductReview>(
    `/reviews/products/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function deleteProductReview(id: number) {
  return apiRequest<void>(
    `/reviews/products/${id}`,
    { method: "DELETE" },
    "customer",
  );
}

/** Customer: create or upsert order review */
export function createOrderReview(payload: CreateOrderReviewPayload) {
  return apiRequest<OrderReview>(
    "/reviews/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function updateOrderReview(
  id: number,
  payload: UpdateOrderReviewPayload,
) {
  return apiRequest<OrderReview>(
    `/reviews/orders/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function deleteOrderReview(id: number) {
  return apiRequest<void>(
    `/reviews/orders/${id}`,
    { method: "DELETE" },
    "customer",
  );
}

export function getMyReviews() {
  return apiRequest<MyReviewsResponse>("/users/me/reviews", {}, "customer");
}

/** Public product reviews */
export function listProductReviews(
  productId: number,
  params: { page?: number; limit?: number } = {},
) {
  return apiRequest<PublicProductReviewsResponse>(
    `/products/${productId}/reviews${buildQuery(params)}`,
  );
}

/** Staff list */
export function listReviews(params: ListReviewsParams = {}) {
  const kind = params.kind ?? "product";
  return apiRequest<PaginatedResponse<ProductReview | OrderReview>>(
    `/reviews${buildQuery({ ...params, kind })}`,
  );
}

export function updateProductReviewVisibility(
  id: number,
  payload: UpdateReviewVisibilityPayload,
) {
  return apiRequest<ProductReview>(`/reviews/products/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateOrderReviewVisibility(
  id: number,
  payload: UpdateReviewVisibilityPayload,
) {
  return apiRequest<OrderReview>(`/reviews/orders/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
