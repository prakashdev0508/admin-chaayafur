import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PurchaseOrderEditor } from "@/components/purchase-orders/PurchaseOrderEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { getOrder } from "@/services/orders.service";

export function CreatePurchaseOrderPage() {
  const { id } = useParams();
  const orderId = Number(id);

  const orderQuery = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return <PageHeader title="Invalid order" />;
  }

  if (orderQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading order…
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Order not found"
          action={
            <Button
              type="button"
              variant="outline"
              render={
                <Link to="/orders">
                  <ArrowLeft />
                  Back to orders
                </Link>
              }
            />
          }
        />
      </div>
    );
  }

  return <PurchaseOrderEditor order={orderQuery.data} />;
}
