import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";

/** Storefront-style product detail loading state. */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-3 w-40" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-10 w-4/5 max-w-md" />
            <Skeleton className="h-3 w-56 font-mono" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>

          <Skeleton className="h-px w-full" />

          <div className="rounded-xl border p-4">
            <Skeleton className="mb-3 h-3 w-28" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Add/edit product form loading state (matches form layout). */
export function ProductFormSkeleton({
  title = "Edit product",
  description = "Update details, inventory, and customization pricing.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader title={title} description={description} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          {/* Details card */}
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <div className="flex items-start gap-3 border-b bg-muted/20 px-6 py-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-24 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-md" />
                  <Skeleton className="h-10 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Images card */}
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <div className="flex items-start justify-between gap-4 border-b bg-muted/20 px-6 py-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-4/3 rounded-xl" />
                ))}
              </div>
              <Skeleton className="mt-4 h-24 w-full rounded-xl border border-dashed" />
            </div>
          </div>

          {/* Customization card */}
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <div className="flex items-start gap-3 border-b bg-muted/20 px-6 py-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky publish rail */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <div className="border-b bg-muted/20 px-6 py-3">
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-4 p-4">
              <Skeleton className="h-14 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border shadow-xs">
            <div className="border-b bg-muted/20 px-6 py-3">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border shadow-xs p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>

          <Skeleton className="h-11 w-full rounded-md" />
        </aside>
      </div>
    </div>
  );
}
