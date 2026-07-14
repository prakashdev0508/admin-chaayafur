import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTreeItem } from "@/types/category";

type HomeCategoryStripProps = {
  categories?: CategoryTreeItem[];
  isLoading?: boolean;
};

export function HomeCategoryStrip({
  categories = [],
  isLoading,
}: HomeCategoryStripProps) {
  const sorted = [...categories].sort((a, b) => {
    const aHasImage = a.imageUrl ? 0 : 1;
    const bHasImage = b.imageUrl ? 0 : 1;
    if (aHasImage !== bHasImage) return aHasImage - bHasImage;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8B5E3C]">Browse</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#3D2B1F]">
            Shop by Categories
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground sm:text-right">
          Explore handcrafted furniture across every room — from bedroom
          essentials to living room statement pieces.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))
          : sorted.map((category) => {
              const productCount = category.subCategories.reduce(
                (sum, sub) => sum + (sub.productsCount ?? 0),
                0,
              );
              const countLabel =
                productCount > 0
                  ? `${productCount}+ products`
                  : `${category.subCategories.length} collections`;

              return (
                <Link
                  key={category.id}
                  to={`/shop/products?categoryId=${category.id}`}
                  className="group relative flex min-h-[176px] flex-col overflow-hidden rounded-2xl bg-[#F2EAE4] p-5 transition hover:bg-[#EDE3D9]"
                >
                  <div className="relative z-10 max-w-[65%]">
                    <h3 className="text-xl font-semibold text-[#3D2B1F]">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium tracking-[0.16em] text-[#3D2B1F] uppercase">
                      Collection
                    </p>
                    <p className="mt-3 text-sm text-[#6B5344]">{countLabel}</p>
                  </div>
                  {category.imageUrl ? (
                    <div className="absolute right-3 bottom-3 h-24 w-[42%] overflow-hidden rounded-xl bg-[#E8DFD3] shadow-sm">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : null}
                </Link>
              );
            })}
      </div>
    </section>
  );
}
