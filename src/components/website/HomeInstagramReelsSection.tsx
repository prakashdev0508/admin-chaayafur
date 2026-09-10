import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { InstagramProductLinkPicker } from "@/components/website/InstagramProductLinkPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  listAdminInstagramMedia,
  listInstagramSelections,
  putInstagramSelections,
} from "@/services/instagram.service";
import type { AdminInstagramMedia } from "@/types/instagram";
import type { ProductListItem } from "@/types/product";

type HomeInstagramReelsSectionProps = {
  canView: boolean;
  canUpdate: boolean;
};

type DraftItem = {
  mediaId: string;
  productId: number | null;
  product: ProductListItem | null;
};

const MAX_SELECTIONS = 50;

function thumbUrl(item: AdminInstagramMedia) {
  return item.thumbnail_url || item.media_url;
}

function sameDraft(
  a: DraftItem[],
  b: DraftItem[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.mediaId === b[index].mediaId &&
      item.productId === b[index].productId,
  );
}

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

function MediaStats({ item }: { item: AdminInstagramMedia }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1" title="Likes">
        <Heart className="size-3" aria-hidden />
        {formatCount(item.like_count)}
      </span>
      {item.view_count != null ? (
        <span className="inline-flex items-center gap-1" title="Views">
          <Eye className="size-3" aria-hidden />
          {formatCount(item.view_count)}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1" title="Comments">
        <MessageCircle className="size-3" aria-hidden />
        {formatCount(item.comments_count)}
      </span>
    </div>
  );
}

function MediaInfo({
  item,
  compact = false,
}: {
  item: AdminInstagramMedia;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", compact ? "p-2" : "px-2.5 pt-2.5")}>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge variant="neutral">{item.media_type}</StatusBadge>
        <span className="truncate text-[10px] text-muted-foreground">
          {formatPostedAt(item.timestamp)}
        </span>
      </div>
      <MediaStats item={item} />
      <p
        className={cn(
          "text-[11px] text-muted-foreground",
          compact ? "line-clamp-2" : "line-clamp-3",
        )}
      >
        {item.caption?.trim() || "No caption"}
      </p>
      <a
        href={item.permalink}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8B5E3C] hover:underline"
      >
        Open on Instagram
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

export function HomeInstagramReelsSection({
  canView,
  canUpdate,
}: HomeInstagramReelsSectionProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [saved, setSaved] = useState<DraftItem[]>([]);

  const mediaQuery = useQuery({
    queryKey: queryKeys.admin.instagram.media,
    queryFn: listAdminInstagramMedia,
    enabled: canView,
  });

  const selectionsQuery = useQuery({
    queryKey: queryKeys.admin.instagram.selections,
    queryFn: listInstagramSelections,
    enabled: canView,
  });

  const media = mediaQuery.data ?? [];
  const mediaById = useMemo(() => {
    const map = new Map<string, AdminInstagramMedia>();
    for (const item of media) map.set(item.id, item);
    return map;
  }, [media]);

  useEffect(() => {
    if (!selectionsQuery.isSuccess) return;
    const ordered = [...selectionsQuery.data]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((row) => ({
        mediaId: row.instagramMediaId,
        productId: row.productId ?? null,
        product: row.product ?? null,
      }));
    setDraft(ordered);
    setSaved(ordered);
  }, [selectionsQuery.isSuccess, selectionsQuery.dataUpdatedAt, selectionsQuery.data]);

  const featured = useMemo(
    () =>
      draft
        .map((item) => {
          const mediaItem = mediaById.get(item.mediaId);
          if (!mediaItem) return null;
          return { media: mediaItem, draft: item };
        })
        .filter(
          (
            entry,
          ): entry is { media: AdminInstagramMedia; draft: DraftItem } =>
            entry != null,
        ),
    [draft, mediaById],
  );

  const draftIds = useMemo(() => draft.map((item) => item.mediaId), [draft]);
  const isDirty = !sameDraft(draft, saved);

  const saveMutation = useMutation({
    mutationFn: () =>
      putInstagramSelections(
        draft.map((item) => ({
          mediaId: item.mediaId,
          productId: item.productId,
        })),
      ),
    onSuccess: async () => {
      toast.success("Instagram selections saved");
      setSaved(draft);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.instagram.all,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.shop.instagram,
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save selections",
      );
    },
  });

  function toggleSelect(id: string) {
    if (!canUpdate) return;
    setDraft((prev) => {
      if (prev.some((item) => item.mediaId === id)) {
        return prev.filter((item) => item.mediaId !== id);
      }
      if (prev.length >= MAX_SELECTIONS) {
        toast.error(`You can feature at most ${MAX_SELECTIONS} posts`);
        return prev;
      }
      const mediaItem = mediaById.get(id);
      return [
        ...prev,
        {
          mediaId: id,
          productId: mediaItem?.productId ?? null,
          product: mediaItem?.product ?? null,
        },
      ];
    });
  }

  function move(id: string, direction: -1 | 1) {
    setDraft((prev) => {
      const index = prev.findIndex((item) => item.mediaId === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function setProductLink(
    mediaId: string,
    next: { productId: number | null; product: ProductListItem | null },
  ) {
    setDraft((prev) =>
      prev.map((item) =>
        item.mediaId === mediaId
          ? {
              ...item,
              productId: next.productId,
              product: next.product,
            }
          : item,
      ),
    );
  }

  if (!canView) return null;

  const loadError = mediaQuery.error ?? selectionsQuery.error;
  const is503 =
    loadError instanceof ApiError && loadError.statusCode === 503;
  const isLoading = mediaQuery.isLoading || selectionsQuery.isLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Instagram feed</CardTitle>
          <CardDescription className="mt-1.5">
            Choose posts and optionally link each to a product. Shoppers who tap
            a reel go to that product page. Max {MAX_SELECTIONS}.
          </CardDescription>
        </div>
        {canUpdate && (
          <Button
            size="sm"
            disabled={!isDirty || saveMutation.isPending || isLoading}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save selections"
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {is503
              ? "Instagram is not configured on the server (missing access token)."
              : loadError instanceof Error
                ? loadError.message
                : "Failed to load Instagram media"}
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  Featured ({featured.length})
                </h3>
                {isDirty ? (
                  <StatusBadge variant="neutral">Unsaved changes</StatusBadge>
                ) : null}
              </div>
              {featured.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  No posts selected yet — pick from the library below
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {featured.map(({ media: item, draft: draftItem }, index) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border bg-card"
                    >
                      <div className="relative aspect-9/16 bg-muted">
                        <img
                          src={thumbUrl(item)}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            <Heart className="size-3 fill-white" aria-hidden />
                            {formatCount(item.like_count)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            {item.view_count != null ? (
                              <>
                                <Eye className="size-3" aria-hidden />
                                {formatCount(item.view_count)}
                              </>
                            ) : (
                              <>
                                <MessageCircle className="size-3" aria-hidden />
                                {formatCount(item.comments_count)}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <MediaInfo item={item} />
                      <div className="border-t px-2.5 py-2">
                        <InstagramProductLinkPicker
                          product={draftItem.product}
                          productId={draftItem.productId}
                          disabled={!canUpdate}
                          onChange={(next) => setProductLink(item.id, next)}
                        />
                      </div>
                      <div className="flex items-center gap-1 border-t px-2 py-2">
                        {canUpdate && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={index === 0}
                              aria-label="Move earlier"
                              onClick={() => move(item.id, -1)}
                            >
                              <ChevronLeft className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={index === featured.length - 1}
                              aria-label="Move later"
                              onClick={() => move(item.id, 1)}
                            >
                              <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="ml-auto text-destructive"
                              aria-label="Remove from featured"
                              onClick={() => toggleSelect(item.id)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                Account library ({media.length})
              </h3>
              {media.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  No media returned from Instagram
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {media.map((item) => {
                    const selected = draftIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!canUpdate}
                        onClick={() => toggleSelect(item.id)}
                        className={cn(
                          "relative overflow-hidden rounded-xl border text-left transition",
                          selected
                            ? "ring-2 ring-[#8B5E3C] ring-offset-2"
                            : "hover:border-foreground/30",
                          !canUpdate && "cursor-default opacity-90",
                        )}
                      >
                        <div className="relative aspect-9/16 bg-muted">
                          <img
                            src={thumbUrl(item)}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                              <Heart className="size-3 fill-white" aria-hidden />
                              {formatCount(item.like_count)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                              {item.view_count != null ? (
                                <>
                                  <Eye className="size-3" aria-hidden />
                                  {formatCount(item.view_count)}
                                </>
                              ) : (
                                <>
                                  <MessageCircle
                                    className="size-3"
                                    aria-hidden
                                  />
                                  {formatCount(item.comments_count)}
                                </>
                              )}
                            </span>
                          </div>
                          {selected ? (
                            <div className="absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full bg-[#8B5E3C] text-white">
                              <Check className="size-3.5" />
                            </div>
                          ) : null}
                        </div>
                        <MediaInfo item={item} compact />
                        {item.productId != null ? (
                          <p className="border-t px-2 py-1.5 text-[11px] text-muted-foreground">
                            Product #{item.productId} linked
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
