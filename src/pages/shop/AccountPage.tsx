import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShopAddressForm } from "@/components/shop/ShopAddressForm";
import { StarRating } from "@/components/reviews/StarRating";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  updateCustomerAddress,
} from "@/services/shop-addresses.service";
import { listShopOrders } from "@/services/shop-orders.service";
import { getMyReferral } from "@/services/shop-referrals.service";
import { getMyWallet } from "@/services/shop-wallet.service";
import { getMyReviews } from "@/services/reviews.service";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { getOrderStatusLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { CustomerAddress } from "@/types/address";

export function AccountPage() {
  const { user, logout } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  );

  const ordersQuery = useQuery({
    queryKey: queryKeys.shop.orders.list({ page: 1, limit: 10 }),
    queryFn: () => listShopOrders({ page: 1, limit: 10 }),
  });

  const addressesQuery = useQuery({
    queryKey: queryKeys.shop.addresses.all,
    queryFn: listCustomerAddresses,
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.shop.reviews.mine,
    queryFn: getMyReviews,
  });

  const referralQuery = useQuery({
    queryKey: queryKeys.shop.referral,
    queryFn: getMyReferral,
  });

  const walletQuery = useQuery({
    queryKey: queryKeys.shop.wallet,
    queryFn: getMyWallet,
  });

  const createAddressMutation = useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      setShowAddressForm(false);
      setEditingAddress(null);
      toast.success("Address saved");
    },
    onError: () => toast.error("Could not save address"),
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof updateCustomerAddress>[1];
    }) => updateCustomerAddress(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      setEditingAddress(null);
      setShowAddressForm(false);
      toast.success("Address updated");
    },
    onError: () => toast.error("Could not update address"),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteCustomerAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      if (editingAddress) setEditingAddress(null);
      toast.success("Address removed");
    },
    onError: () => toast.error("Could not remove address"),
  });

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddress(null);
  }

  function startAddAddress() {
    if (editingAddress) {
      setEditingAddress(null);
      setShowAddressForm(true);
      return;
    }
    setShowAddressForm((open) => !open);
  }

  function startEditAddress(address: CustomerAddress) {
    setShowAddressForm(false);
    setEditingAddress(address);
  }

  const counts = user?.counts;
  const productReviews = reviewsQuery.data?.productReviews ?? [];
  const orderReviews = reviewsQuery.data?.orderReviews ?? [];

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

      {counts && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
              {counts.orders}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
            <p className="text-sm text-muted-foreground">Addresses</p>
            <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
              {counts.addresses}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
            <p className="text-sm text-muted-foreground">Open tickets</p>
            <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
              {counts.openTickets}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
              {counts.reviews}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-medium text-[#3D2B1F]">Refer & earn</h2>
          <Link
            to="/shop/referrals"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open referrals
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Share your code. Earn about 5% after a friend’s order is delivered.
        </p>
        {referralQuery.data && (
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
            <p className="text-sm text-muted-foreground">Your code</p>
            <p className="mt-1 font-mono text-lg font-medium text-[#3D2B1F]">
              {referralQuery.data.code}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-medium text-[#3D2B1F]">Wallet</h2>
          <Link
            to="/shop/wallet"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open wallet
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          View referral earnings and request UPI or bank withdrawals.
        </p>
        {walletQuery.data && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
                {formatCurrency(walletQuery.data.availableBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
                {formatCurrency(walletQuery.data.pendingBalance)}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-medium text-[#3D2B1F]">
            Custom furniture
          </h2>
          <Link
            to="/shop/customize"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            New request
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Request bespoke pieces and track quotes from our workshop team.
        </p>
        <Link
          to="/shop/customize/requests"
          className="inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          View my customization requests
        </Link>
      </section>

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
                  {formatDate(order.createdAt)} · {getOrderStatusLabel(order.status)}
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
        <h2 className="text-xl font-medium text-[#3D2B1F]">My reviews</h2>

        {reviewsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : productReviews.length === 0 && orderReviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E8DFD3] p-6 text-sm text-muted-foreground">
            No reviews yet. After an order is delivered, you can rate products
            and the overall order.
          </p>
        ) : (
          <div className="space-y-3">
            {productReviews.map((review) => (
              <div
                key={`product-${review.id}`}
                className="rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Product review
                    </p>
                    {review.product ? (
                      <Link
                        to={`/shop/products/${review.product.id}`}
                        className="font-medium hover:underline"
                      >
                        {review.product.name}
                      </Link>
                    ) : (
                      <p className="font-medium">Product #{review.productId}</p>
                    )}
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
                {review.orderId && (
                  <Link
                    to={`/shop/orders/${review.orderId}`}
                    className="mt-2 inline-block text-xs text-[#8B5E3C] hover:underline"
                  >
                    View order
                  </Link>
                )}
              </div>
            ))}

            {orderReviews.map((review) => (
              <div
                key={`order-${review.id}`}
                className="rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Order review
                    </p>
                    <Link
                      to={`/shop/orders/${review.orderId}`}
                      className="font-medium hover:underline"
                    >
                      {review.order?.orderNumber ?? `Order #${review.orderId}`}
                    </Link>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#3D2B1F]">Saved addresses</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={startAddAddress}
            disabled={
              (addressesQuery.data?.length ?? 0) >= 5 &&
              !showAddressForm &&
              !editingAddress
            }
          >
            {showAddressForm && !editingAddress ? "Cancel" : "Add address"}
          </Button>
        </div>

        {(showAddressForm || editingAddress) && (
          <ShopAddressForm
            key={editingAddress ? `edit-${editingAddress.id}` : "create"}
            initial={editingAddress ?? undefined}
            loading={
              createAddressMutation.isPending || updateAddressMutation.isPending
            }
            onCancel={closeAddressForm}
            onSubmit={async (payload) => {
              if (editingAddress) {
                const { sameAsBilling: _ignored, ...updatePayload } = payload;
                await updateAddressMutation.mutateAsync({
                  id: editingAddress.id,
                  payload: updatePayload,
                });
                return;
              }
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{address.name}</p>
                  <span className="rounded-full bg-[#F8F1E8] px-2 py-0.5 text-xs font-medium text-[#744C31]">
                    {address.type === "BILLING" ? "Billing" : "Shipping"}
                  </span>
                  {address.isDefault && (
                    <span className="rounded-full bg-[#E8F0E3] px-2 py-0.5 text-xs font-medium text-[#5C7A4A]">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.state} {address.zipCode}
                </p>
                {address.gstin && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    GSTIN {address.gstin}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditAddress(address)}
                  disabled={editingAddress?.id === address.id}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAddressMutation.mutate(address.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
