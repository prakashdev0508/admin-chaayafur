import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isExternalHref, resolveShopHref } from "@/lib/shop-href";
import { cn } from "@/lib/utils";
import type { HomeBanner } from "@/types/home";

type HomeHeroCarouselProps = {
  banners: HomeBanner[];
  className?: string;
};

export function HomeHeroCarousel({ banners, className }: HomeHeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    setIndex(0);
  }, [banners]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const banner = banners[index] ?? banners[0];
  const href = resolveShopHref(banner.redirectUrl);
  const external = isExternalHref(href);

  const content = (
    <>
      <img
        src={banner.imageUrl}
        alt={banner.title ?? "Featured collection"}
        className="size-full object-cover transition duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      {banner.title && (
        <div className="absolute top-5 left-5 z-10 max-w-[70%] sm:top-7 sm:left-7">
          <p className="text-xs font-medium tracking-[0.14em] text-[#E8C4A0] uppercase sm:text-sm">
            Introducing
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white sm:text-4xl">
            {banner.title}
          </h2>
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#F3EBE0]",
        className,
      )}
    >
      <div className="aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[360px]">
        {external ? (
          <a href={href} className="relative block size-full" target="_blank" rel="noreferrer">
            {content}
          </a>
        ) : (
          <Link to={href} className="relative block size-full">
            {content}
          </Link>
        )}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            className="absolute top-1/2 left-3 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3D2B1F] shadow-sm transition hover:bg-white"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIndex((current) => (current - 1 + count) % count);
            }}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            className="absolute top-1/2 right-3 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3D2B1F] shadow-sm transition hover:bg-white"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIndex((current) => (current + 1) % count);
            }}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {banners.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to banner ${dotIndex + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dotIndex === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/80",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
