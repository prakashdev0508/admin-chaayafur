import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listProducts } from "@/services/products.service";
import { queryKeys } from "@/lib/query-keys";
import { productTagLabels } from "@/lib/product-utils";
import type { ProductMerchandisingTag } from "@/types/product";

const VALID_TAGS = new Set<ProductMerchandisingTag>([
  "isBestSeller",
  "isFeaturedProduct",
  "isMostPopular",
  "isNewArrival",
]);

export function ShopCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("name") ?? "");

  const page = Number(searchParams.get("page") ?? "1");
  const categoryId = searchParams.get("categoryId");
  const subCategoryId = searchParams.get("subCategoryId");
  const name = searchParams.get("name") ?? undefined;
  const tagParam = searchParams.get("tag");
  const tag =
    tagParam && VALID_TAGS.has(tagParam as ProductMerchandisingTag)
      ? (tagParam as ProductMerchandisingTag)
      : undefined;

  const listParams = useMemo(
    () => ({
      page,
      limit: 12,
      isActive: true,
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(subCategoryId ? { subCategoryId: Number(subCategoryId) } : {}),
      ...(name ? { name } : {}),
      ...(tag ? { tag } : {}),
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [page, categoryId, subCategoryId, name, tag],
  );

  const categoriesQuery = useQuery({
    queryKey: queryKeys.shop.categories.tree,
    queryFn: fetchCategoriesTree,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.shop.products.list(listParams),
    queryFn: () => listProducts(listParams),
  });

  const products = productsQuery.data?.items ?? [];
  const meta = productsQuery.data?.meta;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-[#3D2B1F]">
          {tag ? productTagLabels[tag] : "All products"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {tag
            ? `Products tagged as ${productTagLabels[tag].toLowerCase()}.`
            : "Browse our full catalogue and add items to your cart."}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          className="flex w-full max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(searchParams);
            if (searchInput.trim()) {
              next.set("name", searchInput.trim());
            } else {
              next.delete("name");
            }
            next.set("page", "1");
            setSearchParams(next);
          }}
        >
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={!categoryId && !subCategoryId && !tag ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchParams({ page: "1" })}
          >
            All
          </Button>
          {categoriesQuery.data?.map((category) => (
            <Button
              key={category.id}
              variant={categoryId === String(category.id) ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSearchParams({ categoryId: String(category.id), page: "1" })
              }
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {categoryId && categoriesQuery.data && (
        <div className="flex flex-wrap gap-2">
          {categoriesQuery.data
            .find((category) => String(category.id) === categoryId)
            ?.subCategories.map((subCategory) => (
              <Button
                key={subCategory.id}
                variant={subCategoryId === String(subCategory.id) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSearchParams({
                    categoryId,
                    subCategoryId: String(subCategory.id),
                    page: "1",
                  })
                }
              >
                {subCategory.name}
              </Button>
            ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {productsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
            ))
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      {!productsQuery.isLoading && products.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#E8DFD3] p-8 text-center text-muted-foreground">
          No products found for this filter.
        </p>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page - 1));
              setSearchParams(next);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page + 1));
              setSearchParams(next);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
