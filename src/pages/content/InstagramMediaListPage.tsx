import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Film,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { listAdminInstagramMedia } from "@/services/instagram.service";

function formatCount(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 1000) return String(value);
  if (value < 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function formatPostedAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InstagramMediaListPage() {
  const mediaQuery = useQuery({
    queryKey: queryKeys.admin.instagram.media,
    queryFn: listAdminInstagramMedia,
  });

  const items = mediaQuery.data ?? [];
  const is503 =
    mediaQuery.error instanceof ApiError && mediaQuery.error.statusCode === 503;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Instagram"
        description="All posts from the connected Instagram account. Open a post to view its insights report."
        action={
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh Instagram media"
            onClick={() => void mediaQuery.refetch()}
            disabled={mediaQuery.isFetching}
          >
            <RefreshCw
              className={`size-4 ${mediaQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        }
      />

      {mediaQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : mediaQuery.isError ? (
        <EmptyState
          icon={Film}
          title="Could not load Instagram media"
          description={
            is503
              ? "Instagram is not configured on the server (missing access token)."
              : mediaQuery.error instanceof Error
                ? mediaQuery.error.message
                : "Something went wrong."
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No Instagram posts"
          description="No media was returned from the connected Instagram account."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const thumb = item.thumbnail_url || item.media_url;
            return (
              <Link
                key={item.id}
                to={`/content/instagram/${encodeURIComponent(item.id)}`}
                className="group overflow-hidden rounded-xl border bg-card transition hover:border-foreground/25 hover:shadow-sm"
              >
                <div className="relative aspect-9/16 bg-muted">
                  <img
                    src={thumb}
                    alt=""
                    className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <StatusBadge variant="neutral">{item.media_type}</StatusBadge>
                    {item.isSelected ? (
                      <StatusBadge variant="success">Featured</StatusBadge>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.caption?.trim() || "Untitled post"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" />
                      {formatCount(item.like_count)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3" />
                      {formatCount(item.comments_count)}
                    </span>
                    <span className="ml-auto">{formatPostedAt(item.timestamp)}</span>
                  </div>
                  {item.productId != null ? (
                    <p className="text-[11px] text-muted-foreground">
                      Linked product #{item.productId}
                    </p>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8B5E3C]">
                    View report
                    <ExternalLink className="size-3 opacity-0 transition group-hover:opacity-100" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
