import { Link } from "react-router-dom";
import { isExternalHref, resolveShopHref } from "@/lib/shop-href";
import { cn } from "@/lib/utils";
import type { HomeBanner } from "@/types/home";

type HomeSubBannerCardsProps = {
  banners: HomeBanner[];
  className?: string;
};

export function HomeSubBannerCards({
  banners,
  className,
}: HomeSubBannerCardsProps) {
  const cards = [...banners]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 2);

  if (cards.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {cards.map((banner) => {
        const href = resolveShopHref(banner.redirectUrl);
        const external = isExternalHref(href);
        const cardClass =
          "group flex min-h-[160px] flex-1 overflow-hidden rounded-2xl bg-[#F2EAE4] transition hover:bg-[#EDE3D9]";

        const inner = (
          <>
            <div className="flex flex-1 flex-col justify-center p-5 pr-3">
              <h3 className="text-2xl font-semibold text-[#3D2B1F]">
                {banner.title || "Collection"}
              </h3>
              <p className="mt-1 text-xs font-medium tracking-[0.16em] text-[#3D2B1F] uppercase">
                Collection
              </p>
            </div>
            <div className="relative w-[42%] shrink-0 self-stretch p-3">
              <div className="size-full overflow-hidden rounded-xl bg-[#E8DFD3]">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? "Collection"}
                  className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </>
        );

        if (external) {
          return (
            <a
              key={banner.id}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cardClass}
            >
              {inner}
            </a>
          );
        }

        return (
          <Link key={banner.id} to={href} className={cardClass}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
