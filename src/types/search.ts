export type AdminSearchHitType =
  | "product"
  | "category"
  | "subcategory"
  | "order"
  | "invoice"
  | "customer"
  | "coupon"
  | "support_ticket"
  | "payment";

export type PublicSearchHitType = "product" | "category" | "subcategory";

export type SearchHitBase = {
  id: number;
  slug: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  rank: number;
  status: string | null;
};

export type AdminSearchHit = SearchHitBase & {
  type: AdminSearchHitType;
  orderId?: number | null;
  orderNumber?: string | null;
  phone?: string | null;
};

export type PublicSearchHit = SearchHitBase & {
  type: PublicSearchHitType;
};

export type AdminSearchResponse = {
  items: AdminSearchHit[];
  query: string;
};

export type PublicSearchResponse = {
  items: PublicSearchHit[];
  query: string;
};

export type AdminSearchParams = {
  q: string;
  limit?: number;
  /** CSV or array of allowed types */
  types?: AdminSearchHitType[] | string;
};

export type PublicSearchParams = {
  q: string;
  limit?: number;
};
