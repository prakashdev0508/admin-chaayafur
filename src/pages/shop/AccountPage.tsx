import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { ShopAddressForm } from "@/components/shop/ShopAddressForm";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
} from "@/services/shop-addresses.service";
import { listShopOrders } from "@/services/shop-orders.service";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccountPage() {
  const { user, logout } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);

  const ordersQuery = useQuery({
    queryKey: queryKeys.shop.orders.list({ page: 1, limit: 10 }),
    queryFn: () => listShopOrders({ page: 1, limit: 10 }),
  });

  const addressesQuery = useQuery({
    queryKey: queryKeys.shop.addresses.all,
    queryFn: listCustomerAddresses,
  });

  const createAddressMutation = useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      setShowAddressForm(false);
      toast.success("Address saved");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteCustomerAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      toast.success("Address removed");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">My account</h1>
          {user && (
            <p className="mt-2 text-muted-foreground">
              Signed in as {formatPhone(user.phone)}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#3D2B1F]">Recent orders</h2>
          <Link
            to="/shop/products"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Shop again
          </Link>
        </div>

        <div className="space-y-3">
          {ordersQuery.data?.items.map((order) => (
            <Link
              key={order.id}
              to={`/shop/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-[#E8DFD3] bg-white p-4 transition hover:border-[#C9B59A]"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)} · {order.status}
                  {order.coupon ? ` · ${order.coupon.code}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                {parseFloat(order.discountAmount) > 0 && (
                  <p className="text-xs text-[#5C7A4A]">
                    Saved {formatCurrency(order.discountAmount)}
                  </p>
                )}
              </div>
            </Link>
          ))}

          {!ordersQuery.isLoading && (ordersQuery.data?.items.length ?? 0) === 0 && (
            <p className="rounded-xl border border-dashed border-[#E8DFD3] p-6 text-sm text-muted-foreground">
              No orders yet.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#3D2B1F]">Saved addresses</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddressForm((value) => !value)}
            disabled={(addressesQuery.data?.length ?? 0) >= 5 && !showAddressForm}
          >
            Add address
          </Button>
        </div>

        {showAddressForm && (
          <ShopAddressForm
            loading={createAddressMutation.isPending}
            onCancel={() => setShowAddressForm(false)}
            onSubmit={async (payload) => {
              await createAddressMutation.mutateAsync(payload);
            }}
          />
        )}

        <div className="grid gap-3">
          {addressesQuery.data?.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[#E8DFD3] bg-white p-4"
            >
              <div>
                <p className="font-medium">{address.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.state} {address.zipCode}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAddressMutation.mutate(address.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
