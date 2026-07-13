import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CouponForm } from "@/components/coupons/CouponForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatCouponDiscount, getCouponStatus } from "@/lib/coupon-utils";
import { queryKeys } from "@/lib/query-keys";
import { getCoupon, updateCoupon } from "@/services/coupons.service";
import { usePermission } from "@/hooks/usePermission";
import type { UpdateCouponPayload } from "@/types/coupon";

export function CouponDetailPage() {
  const { id } = useParams();
  const couponId = Number(id);
  const { hasPermission } = usePermission();

  const { data: coupon, isLoading } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId),
    queryFn: () => getCoupon(couponId),
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
        <Button variant="outline" render={<Link to="/coupons">Back to coupons</Link>} />
      </div>
    );
  }

  const status = getCouponStatus(coupon);

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
            {hasPermission("update-coupons") && (
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
                {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : " / unlimited"}
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
      </div>
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
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.detail(couponId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
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
        <Button variant="outline" render={<Link to="/coupons">Back to coupons</Link>} />
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
        onSubmit={(payload) => mutation.mutateAsync(payload as UpdateCouponPayload)}
      />
    </div>
  );
}
