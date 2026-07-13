import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CouponForm } from "@/components/coupons/CouponForm";
import { queryKeys } from "@/lib/query-keys";
import { createCoupon } from "@/services/coupons.service";
import type { CreateCouponPayload } from "@/types/coupon";

export function AddCouponPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateCouponPayload) => createCoupon(payload),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      toast.success("Coupon created");
      navigate(`/coupons/${coupon.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create coupon",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="New coupon"
        description="Create a discount code for your store."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/coupons">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <CouponForm
        mode="create"
        loading={mutation.isPending}
        onSubmit={(payload) => mutation.mutateAsync(payload as CreateCouponPayload)}
      />
    </div>
  );
}
