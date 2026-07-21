import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CouponForm } from "@/components/coupons/CouponForm";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { formatCouponDiscount, getCouponStatus } from "@/lib/coupon-utils";
import { getOrderStatusLabel } from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { getCoupon, updateCoupon } from "@/services/coupons.service";
import { usePermission } from "@/hooks/usePermission";
import type { UpdateCouponPayload } from "@/types/coupon";
import { PERMISSIONS } from "@/lib/roles";

export function CouponDetailPage() {
  const { id } = useParams();
  const couponId = Number(id);
  const { hasPermission } = usePermission();
  const [redemptionPage, setRedemptionPage] = useState(0);
  const redemptionPageSize = 20;

  const redemptionParams = {
    page: redemptionPage + 1,
    limit: redemptionPageSize,
  };

  const { data: coupon, isLoading } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId, redemptionParams),
    queryFn: () => getCoupon(couponId, redemptionParams),
    enabled: Number.isFinite(couponId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Coupon not found" />
        <Button
          variant="outline"
          render={<Link to="/coupons">Back to coupons</Link>}
        />
      </div>
    );
  }

  const status = getCouponStatus(coupon);
  const redemptions = coupon.redemptions?.items ?? [];
  const redemptionMeta = coupon.redemptions?.meta;
  const totalPages = redemptionMeta?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={coupon.code}
        description={coupon.description ?? "Discount coupon"}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={
                <Link to="/coupons">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
            {hasPermission(PERMISSIONS.UPDATE_COUPONS) && (
              <Button
                render={
                  <Link to={`/coupons/${coupon.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                }
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Details</CardTitle>
              <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{coupon.type === "FLAT_CART" ? "Flat" : "Percentage"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>{formatCouponDiscount(coupon)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min cart</span>
              <span>{formatCurrency(coupon.minCartAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visibility</span>
              <span>{coupon.visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span>
                {coupon.usedCount}
                {coupon.maxUses !== null
                  ? ` / ${coupon.maxUses}`
                  : " / unlimited"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per customer limit</span>
              <span>
                {coupon.perPersonAllowed !== null
                  ? coupon.perPersonAllowed
                  : "Unlimited"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid from</span>
              <span>{formatDate(coupon.startsAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span>{formatDate(coupon.expiresAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redemption notes</CardTitle>
            <CardDescription>
              All-time history from coupon_redemption_history. Cancelled and
              refunded orders still count toward per-customer limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Global <span className="text-foreground">usedCount</span> is
              restored when payment fails or staff cancels an order.
            </p>
            <p>
              Per-customer history rows are never removed on cancel or refund.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Redemptions</CardTitle>
            <CardDescription>
              {redemptionMeta
                ? `${redemptionMeta.total} all-time redemption${redemptionMeta.total === 1 ? "" : "s"}`
                : "All-time redemption history"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No redemptions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Discount</th>
                    <th className="px-2 py-2 font-medium">Order total</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-2 py-2">{formatDate(row.createdAt)}</td>
                      <td className="px-2 py-2">
                        <Link
                          to={`/customers/${row.customerId}`}
                          className="hover:underline"
                        >
                          {formatPhone(row.customer.phone)}
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        <Link
                          to={`/orders/${row.orderId}`}
                          className="font-medium hover:underline"
                        >
                          {row.order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        {getOrderStatusLabel(row.order.status)}
                      </td>
                      <td className="px-2 py-2">
                        {formatCurrency(row.discountAmount)}
                      </td>
                      <td className="px-2 py-2">
                        {formatCurrency(row.order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={redemptionPage <= 0}
                onClick={() => setRedemptionPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {redemptionPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={redemptionPage + 1 >= totalPages}
                onClick={() => setRedemptionPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function EditCouponPage() {
  const { id } = useParams();
  const couponId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coupon, isLoading } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId),
    queryFn: () => getCoupon(couponId),
    enabled: Number.isFinite(couponId),
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateCouponPayload) =>
      updateCoupon(couponId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["coupons", "detail", couponId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      toast.success("Coupon updated");
      navigate(`/coupons/${couponId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update coupon",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Coupon not found" />
        <Button
          variant="outline"
          render={<Link to="/coupons">Back to coupons</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Edit ${coupon.code}`}
        description="Update coupon settings."
        action={
          <Button
            variant="outline"
            render={
              <Link to={`/coupons/${coupon.id}`}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <CouponForm
        mode="edit"
        initial={coupon}
        loading={mutation.isPending}
        onSubmit={(payload) =>
          mutation.mutateAsync(payload as UpdateCouponPayload)
        }
      />
    </div>
  );
}
