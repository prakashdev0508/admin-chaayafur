export type ReviewKind = "product" | "order";

export type ReviewCustomerSummary = {
  id: number;
  phone: string;
};

export type ProductReview = {
  id: number;
  customerId: number;
  productId: number;
  orderId: number | null;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: ReviewCustomerSummary;
  product?: {
    id: number;
    name: string;
    slug: string;
  };
  order?: {
    id: number;
    orderNumber: string;
  };
};

export type OrderReview = {
  id: number;
  orderId: number;
  customerId: number;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: ReviewCustomerSummary;
  order?: {
    id: number;
    orderNumber: string;
  };
};

export type PublicProductReview = {
  id: number;
  rating: number;
  comment: string | null;
  customer: ReviewCustomerSummary;
  createdAt: string;
  updatedAt: string;
};

export type PublicProductReviewsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  ratingAverage: number | null;
  reviewCount: number;
};

export type PublicProductReviewsResponse = {
  items: PublicProductReview[];
  meta: PublicProductReviewsMeta;
};

export type MyReviewsResponse = {
  productReviews: ProductReview[];
  orderReviews: OrderReview[];
};

export type CreateProductReviewPayload = {
  orderId: number;
  productId: number;
  rating: number;
  comment?: string;
};

export type UpdateProductReviewPayload = {
  rating?: number;
  comment?: string | null;
};

export type CreateOrderReviewPayload = {
  orderId: number;
  rating: number;
  comment?: string;
};

export type UpdateOrderReviewPayload = {
  rating?: number;
  comment?: string | null;
};

export type UpdateReviewVisibilityPayload = {
  isVisible: boolean;
};

export type ListReviewsParams = {
  kind?: ReviewKind;
  productId?: number;
  orderId?: number;
  customerId?: number;
  isVisible?: boolean;
  page?: number;
  limit?: number;
};

export type StaffReviewListItem = ProductReview | OrderReview;
