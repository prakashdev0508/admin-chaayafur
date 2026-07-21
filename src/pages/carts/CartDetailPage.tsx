import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, ShoppingBag } from "lucide-react";
import { AdminCartItemsPanel } from "@/components/carts/AdminCartItemsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { getAdminCart } from "@/services/admin-carts.service";

export function CartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cartId = Number(id);
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CUSTOMERS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CUSTOMERS);
  const [addOpen, setAddOpen] = useState(false);

  const cartQuery = useQuery({
    queryKey: queryKeys.carts.detail(cartId),
    queryFn: () => getAdminCart(cartId),
    enabled: canView && Number.isFinite(cartId),
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Cart" description="Cart details." />
        <EmptyState
          icon={ShoppingBag}
          title="Access restricted"
          description="You do not have permission to view carts."
        />
      </div>
    );
  }

  if (cartQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartQuery.isError || !cartQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Cart" description="Cart details." />
        <EmptyState
          icon={ShoppingBag}
          title="Cart not found"
          description={
            cartQuery.error instanceof Error
              ? cartQuery.error.message
              : "Could not load this cart."
          }
        />
        <Button variant="outline" onClick={() => navigate("/carts")}>
          Back to carts
        </Button>
      </div>
    );
  }

  const cart = cartQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Cart #${cart.id}`}
        description={`${formatPhone(cart.customer.phone)} · ${formatCurrency(cart.subtotalAmount)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={
                <Link to="/carts">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
            <Button
              variant="outline"
              render={<Link to={`/customers/${cart.customerId}`}>Customer</Link>}
            />
            {canUpdate && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add / update item
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>
              Prices are live from product data. Unavailable lines fail at
              checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminCartItemsPanel
              cart={cart}
              canUpdate={canUpdate}
              showAddButton={false}
              addOpen={addOpen}
              onAddOpenChange={setAddOpen}
              extraInvalidateKeys={[
                queryKeys.customers.detail(cart.customerId),
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <Link
                to={`/customers/${cart.customerId}`}
                className="hover:underline"
              >
                {formatPhone(cart.customer.phone)}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item qty</span>
              <span>{cart.itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(cart.subtotalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(cart.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(cart.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
