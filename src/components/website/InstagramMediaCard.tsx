import { Link } from "react-router-dom";
import { ExternalLink, Eye, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstagramMedia } from "@/types/instagram";

type InstagramMediaCardProps = {
  media: Pick<
    InstagramMedia,
    | "media_type"
    | "media_url"
    | "thumbnail_url"
    | "permalink"
    | "caption"
    | "like_count"
    | "comments_count"
    | "view_count"
    | "productId"
    | "product"
  >;
  className?: string;
  /** Play muted looping video when type is VIDEO */
  autoPlay?: boolean;
  showCaption?: boolean;
  showPermalink?: boolean;
  /** Overlay likes (left) and views/comments (right) on the media */
  showStats?: boolean;
};

function isVideo(mediaType: string) {
  return mediaType.toUpperCase() === "VIDEO";
}

function formatCount(value: number | undefined | null): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value < 1000) return String(value);
  if (value < 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function InstagramMediaCard({
  media,
  className,
  autoPlay = true,
  showCaption = false,
  showPermalink = true,
  showStats = false,
}: InstagramMediaCardProps) {
  const poster = media.thumbnail_url || undefined;
  const video = isVideo(media.media_type);
  const likesLabel = formatCount(media.like_count);
  const viewsLabel = formatCount(media.view_count);
  const commentsLabel = formatCount(media.comments_count);
  const rightLabel = viewsLabel ?? commentsLabel;
  const RightIcon = viewsLabel != null ? Eye : MessageCircle;
  const product = media.product ?? null;
  const productHref = product?.slug
    ? `/shop/products/${product.slug}`
    : media.productId != null
      ? `/shop/products/${media.productId}`
      : null;

  const mediaEl = video ? (
    <video
      src={media.media_url}
      poster={poster}
      className="size-full object-cover"
      muted
      playsInline
      loop
      autoPlay={autoPlay}
      controls={!autoPlay}
      preload="metadata"
    />
  ) : (
    <img
      src={media.media_url}
      alt={media.caption?.slice(0, 80) || "Instagram post"}
      className="size-full object-cover"
      loading="lazy"
    />
  );

  return (
    <article className={cn("space-y-2", className)}>
      <div className="relative aspect-9/16 overflow-hidden rounded-xl border bg-muted">
        {productHref ? (
          <Link
            to={productHref}
            className="absolute inset-0 block"
            aria-label={
              product?.name
                ? `Shop ${product.name}`
                : "Shop linked product"
            }
          >
            {mediaEl}
          </Link>
        ) : (
          mediaEl
        )}

        {showStats && (likesLabel != null || rightLabel != null) ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            {likesLabel != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Heart className="size-3 fill-white" aria-hidden />
                <span className="sr-only">Likes</span>
                {likesLabel}
              </span>
            ) : (
              <span />
            )}
            {rightLabel != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <RightIcon className="size-3" aria-hidden />
                <span className="sr-only">
                  {viewsLabel != null ? "Views" : "Comments"}
                </span>
                {rightLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {showCaption && media.caption ? (
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {media.caption}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {productHref ? (
          <Link
            to={productHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#8B5E3C] hover:underline"
          >
            {product?.name ? `Shop ${product.name}` : "Shop this look"}
          </Link>
        ) : null}
        {showPermalink ? (
          <a
            href={media.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
          >
            View on Instagram
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
