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

export type InstagramInsightItem = {
  name: string;
  period: string;
  title: string;
  description: string;
  value: number | null;
};

export type InstagramMediaInsightsMetrics = {
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  total_interactions: number | null;
  ig_reels_video_view_total_time: number | null;
  ig_reels_avg_watch_time: number | null;
  clips_replays_count: number | null;
  reels_skip_rate: number | null;
  [key: string]: number | null | undefined;
};

export type InstagramMediaWatchTime = {
  avgWatchTimeMs: number | null;
  avgWatchTimeSeconds: number | null;
  totalWatchTimeMs: number | null;
  totalWatchTimeSeconds: number | null;
};

export type InstagramMediaInsights = {
  mediaId: string;
  media: InstagramMedia | null;
  metrics: InstagramMediaInsightsMetrics;
  watchTime: InstagramMediaWatchTime;
  insights: InstagramInsightItem[];
};
