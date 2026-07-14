import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/shop/ProductCard";
import { HomeCategoryStrip } from "@/components/shop/HomeCategoryStrip";
import { HomeHeroCarousel } from "@/components/shop/HomeHeroCarousel";
import { HomeSubBannerCards } from "@/components/shop/HomeSubBannerCards";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategoriesTree } from "@/services/categories.service";
import { fetchHome } from "@/services/home.service";
import { productTagLabels } from "@/lib/product-utils";
import { queryKeys } from "@/lib/query-keys";
import type { HomePayload } from "@/types/home";
import type { ProductListItem, ProductMerchandisingTag } from "@/types/product";

const PRODUCT_SECTIONS: {
  key: keyof Pick<
    HomePayload,
    "featuredProducts" | "bestSellers" | "newArrivals" | "mostPopular"
  >;
  tag: ProductMerchandisingTag;
  title: string;
  description: string;
}[] = [
  {
    key: "featuredProducts",
    tag: "isFeaturedProduct",
    title: "Featured",
    description: "Hand-picked pieces from the catalogue",
  },
  {
    key: "bestSellers",
    tag: "isBestSeller",
    title: "Best sellers",
    description: "Customer favourites",
  },
  {
    key: "newArrivals",
    tag: "isNewArrival",
    title: "New arrivals",
    description: "Fresh additions to the collection",
  },
  {
    key: "mostPopular",
    tag: "isMostPopular",
    title: "Most popular",
    description: "Trending across the store",
  },
];

function ProductSection({
  title,
  description,
  tag,
  products,
  isLoading,
}: {
  title: string;
  description: string;
  tag: ProductMerchandisingTag;
  products: ProductListItem[];
  isLoading: boolean;
}) {
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-[#3D2B1F]">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link
          to={`/shop/products?tag=${tag}`}
          className="text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          View {productTagLabels[tag].toLowerCase()}
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  );
}

export function ShopHomePage() {
  const homeQuery = useQuery({
    queryKey: queryKeys.shop.home,
    queryFn: fetchHome,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.shop.categories.tree,
    queryFn: fetchCategoriesTree,
  });

  const home = homeQuery.data;
  const mainBanners = home?.banners ?? [];
  const subBanners = home?.subBanners ?? [];
  const showHero = homeQuery.isLoading || mainBanners.length > 0 || subBanners.length > 0;

  return (
    <div className="space-y-12">
      {showHero && (
        <section className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-stretch">
          {homeQuery.isLoading ? (
            <>
              <Skeleton className="min-h-[320px] rounded-2xl lg:min-h-[360px]" />
              <div className="flex flex-col gap-4">
                <Skeleton className="min-h-[160px] flex-1 rounded-2xl" />
                <Skeleton className="min-h-[160px] flex-1 rounded-2xl" />
              </div>
            </>
          ) : (
            <>
              {mainBanners.length > 0 ? (
                <HomeHeroCarousel banners={mainBanners} className="lg:h-full" />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-[#F3EBE0] px-6 text-center text-muted-foreground lg:min-h-[360px]">
                  Homepage banners coming soon
                </div>
              )}
              {subBanners.length > 0 ? (
                <HomeSubBannerCards banners={subBanners} className="lg:h-full" />
              ) : (
                <div className="hidden lg:block" />
              )}
            </>
          )}
        </section>
      )}

      <HomeCategoryStrip
        categories={categoriesQuery.data}
        isLoading={categoriesQuery.isLoading}
      />

      {PRODUCT_SECTIONS.map((section) => (
        <ProductSection
          key={section.key}
          title={section.title}
          description={section.description}
          tag={section.tag}
          products={home?.[section.key] ?? []}
          isLoading={homeQuery.isLoading}
        />
      ))}

      {homeQuery.isError && (
        <p className="rounded-xl border border-dashed border-[#E8DFD3] p-6 text-center text-sm text-muted-foreground">
          {homeQuery.error instanceof Error
            ? homeQuery.error.message
            : "Could not load homepage content."}
        </p>
      )}
    </div>
  );
}
