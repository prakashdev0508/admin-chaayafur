import { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { fetchInstagramFeed } from "@/services/instagram.service";
import type { InstagramMedia } from "@/types/instagram";
import type { ProductListItem } from "@/types/product";

function formatCount(value: number | undefined | null): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value < 1000) return String(value);
  if (value < 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function discountPercent(product: ProductListItem): number | null {
  const price = Number.parseFloat(product.price);
  const mrp = product.priceWithoutDiscount
    ? Number.parseFloat(product.priceWithoutDiscount)
    : NaN;
  if (!Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= price || mrp <= 0) {
    return null;
  }
  return Math.round(((mrp - price) / mrp) * 100);
}

function productHref(media: InstagramMedia): string | null {
  if (media.product?.slug) return `/shop/products/${media.product.slug}`;
  if (media.product?.id != null) return `/shop/products/${media.product.id}`;
  if (media.productId != null) return `/shop/products/${media.productId}`;
  return null;
}

function RatingStars({
  average,
  count,
}: {
  average?: number | null;
  count?: number;
}) {
  if (average == null && (count == null || count === 0)) return null;
  const filled = Math.round(Math.min(5, Math.max(0, average ?? 0)));

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "size-3.5",
              index < filled
                ? "fill-[#E8A317] text-[#E8A317]"
                : "fill-transparent text-[#D6C7B5]",
            )}
          />
        ))}
      </div>
      {count != null && count > 0 ? (
        <span className="text-xs text-muted-foreground">({count})</span>
      ) : null}
    </div>
  );
}

function ShoppableVideoCard({ media }: { media: InstagramMedia }) {
  const product = media.product ?? null;
  const href = productHref(media);
  const video = media.media_type.toUpperCase() === "VIDEO";
  const likesLabel = formatCount(media.like_count);
  const viewsLabel = formatCount(media.view_count);
  const commentsLabel = formatCount(media.comments_count);
  const rightLabel = viewsLabel ?? commentsLabel;
  const RightIcon = viewsLabel != null ? Eye : MessageCircle;
  const discount = product ? discountPercent(product) : null;
  const mrp =
    product?.priceWithoutDiscount &&
    Number.parseFloat(product.priceWithoutDiscount) >
      Number.parseFloat(product.price)
      ? product.priceWithoutDiscount
      : null;

  const mediaInner = video ? (
    <video
      src={media.media_url}
      poster={media.thumbnail_url || undefined}
      className="size-full object-cover"
      muted
      playsInline
      loop
      autoPlay
      preload="metadata"
    />
  ) : (
    <img
      src={media.media_url}
      alt={product?.name || media.caption?.slice(0, 80) || "Shoppable video"}
      className="size-full object-cover"
      loading="lazy"
    />
  );

  const body = (
    <>
      <div className="relative aspect-9/16 overflow-hidden rounded-lg bg-[#F3EBE0]">
        {mediaInner}
        {(likesLabel != null || rightLabel != null) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            {likesLabel != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Heart className="size-3 fill-white" aria-hidden />
                {likesLabel}
              </span>
            ) : (
              <span />
            )}
            {rightLabel != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <RightIcon className="size-3" aria-hidden />
                {rightLabel}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug text-[#2C2C2C]">
          {product?.name || media.caption?.trim() || "Featured look"}
        </h3>

        {product ? (
          <>
            <RatingStars
              average={product.ratingAverage}
              count={product.reviewCount}
            />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-base font-semibold text-[#1A1A1A]">
                {formatCurrency(product.price)}
              </span>
              {mrp ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(mrp)}
                </span>
              ) : null}
              {discount != null && discount > 0 ? (
                <span className="text-sm font-semibold text-[#2E7D32]">
                  {discount}% OFF
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );

  const cardClass = "w-[240px] shrink-0 sm:w-[260px]";

  if (href) {
    return (
      <Link
        to={href}
        className={cn(cardClass, "block transition hover:opacity-95")}
      >
        {body}
      </Link>
    );
  }

  return <article className={cardClass}>{body}</article>;
}

export function ShopInstagramReelsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const feedQuery = useQuery({
    queryKey: queryKeys.shop.instagram,
    queryFn: fetchInstagramFeed,
  });

  const items = feedQuery.data ?? [];

  if (feedQuery.isError || (!feedQuery.isLoading && items.length === 0)) {
    return null;
  }

  function scrollByCard(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 560);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section className="space-y-6">
      <h2 className="text-center font-serif text-2xl tracking-tight text-[#3D2B1F] sm:text-3xl">
        Shoppable Videos
      </h2>

      <div className="relative">
        {!feedQuery.isLoading && items.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-[28%] left-0 z-10 hidden size-9 -translate-x-1/2 rounded-full border-[#E8DFD3] bg-white/95 shadow-sm lg:inline-flex"
              aria-label="Scroll shoppable videos left"
              onClick={() => scrollByCard(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-[28%] right-0 z-10 hidden size-9 translate-x-1/2 rounded-full border-[#E8DFD3] bg-white/95 shadow-sm lg:inline-flex"
              aria-label="Scroll shoppable videos right"
              onClick={() => scrollByCard(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        ) : null}

        {feedQuery.isLoading ? (
          <div className="flex gap-5 overflow-hidden pb-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-[240px] shrink-0 space-y-3 sm:w-[260px]">
                <div className="aspect-9/16 animate-pulse rounded-lg bg-[#F3EBE0]" />
                <div className="h-4 w-[85%] animate-pulse rounded bg-[#F3EBE0]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#F3EBE0]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#F3EBE0]" />              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <ShoppableVideoCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
