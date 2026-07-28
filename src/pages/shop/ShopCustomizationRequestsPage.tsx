import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CustomizationRequestStatusBadge } from "@/components/customization-requests/CustomizationRequestStatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { listMyCustomizationRequests } from "@/services/shop-customization-requests.service";

export function ShopCustomizationRequestsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const params = useMemo(() => ({ page, limit }), [page]);

  const listQuery = useQuery({
    queryKey: queryKeys.shop.customizationRequests.list(params),
    queryFn: () => listMyCustomizationRequests(params),
  });

  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.meta.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">
            Custom requests
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track furniture customization requests you have submitted.
          </p>
        </div>
        <Link
          to="/shop/customize"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-[#D9CBB8]",
          )}
        >
          New request
        </Link>
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#E8DFD3] bg-white p-8 text-center text-muted-foreground">
          <p>No customization requests yet.</p>
          <Link
            to="/shop/customize"
            className="mt-4 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
          >
            Start a custom request
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((request) => (
            <li key={request.id}>
              <Link
                to={`/shop/customize/requests/${request.id}`}
                className="block rounded-2xl border border-[#E8DFD3] bg-white p-4 transition hover:border-[#D9CBB8]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#3D2B1F]">
                      {request.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      #{request.id} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <CustomizationRequestStatusBadge status={request.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
