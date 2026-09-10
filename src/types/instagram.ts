import type { ProductListItem } from "@/types/product";

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;

export type InstagramMedia = {
  id: string;
  media_type: InstagramMediaType;
  media_url: string;
  thumbnail_url?: string | null;
  permalink: string;
  caption?: string | null;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  /** Present when Graph insights/views are available */
  view_count?: number;
  productId?: number | null;
  product?: ProductListItem | null;
};

export type AdminInstagramMedia = InstagramMedia & {
  isSelected: boolean;
  productId?: number | null;
};

export type InstagramSelection = {
  id: number;
  instagramMediaId: string;
  productId?: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: ProductListItem | null;
};

/** Shape returned inside `data` for media / public feed list endpoints. */
export type InstagramMediaListPayload = {
  data: InstagramMedia[];
};

export type AdminInstagramMediaListPayload = {
  data: AdminInstagramMedia[];
};

export type InstagramSelectionItemInput = {
  mediaId: string;
  /** Optional product link; `null` clears. Omit to keep existing on partial semantics (we always send it). */
  productId?: number | null;
};

export type PutInstagramSelectionsPayload = {
  items: InstagramSelectionItemInput[];
};
