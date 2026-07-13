import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listProducts } from "@/services/products.service";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export function ShopHomePage() {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.shop.categories.tree,
    queryFn: fetchCategoriesTree,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.shop.products.list({ page: 1, limit: 8, isActive: true }),
    queryFn: () => listProducts({ page: 1, limit: 8, isActive: true, sortBy: "createdAt", sortOrder: "desc" }),
  });

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-[#E8DFD3] bg-[#F3EBE0] px-6 py-12 sm:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8B5E3C]">Chaaya Furnitures</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-[#3D2B1F] sm:text-5xl">
          Thoughtfully crafted furniture for warm, lived-in homes.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Browse our catalogue, add pieces to your cart, and checkout securely with OTP login and Razorpay.
        </p>
        <Link
          to="/shop/products"
          className={cn(buttonVariants(), "mt-6 bg-[#8B5E3C] hover:bg-[#744C31]")}
        >
          Shop collection
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-[#3D2B1F]">Shop by category</h2>
            <p className="text-sm text-muted-foreground">Explore rooms and collections</p>
          </div>
          <Link to="/shop/products" className="text-sm font-medium text-[#8B5E3C] hover:underline">
            View all
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesQuery.isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl" />
              ))
            : categoriesQuery.data?.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop/products?categoryId=${category.id}`}
                  className="rounded-2xl border border-[#E8DFD3] bg-white p-5 transition hover:border-[#C9B59A]"
                >
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.subCategories.length} collections
                  </p>
                </Link>
              ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-[#3D2B1F]">Featured products</h2>
            <p className="text-sm text-muted-foreground">Recently added to the catalogue</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productsQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
              ))
            : productsQuery.data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>
    </div>
  );
}
