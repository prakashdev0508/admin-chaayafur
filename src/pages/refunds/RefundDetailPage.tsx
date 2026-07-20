import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { RefundCompleteResultDialog } from "@/components/orders/RefundCompleteResultDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOrderStatusLabel } from "@/lib/order-status";
import {
  refundEventLabels,
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  cancelOrderRefund,
  completeOrderRefund,
} from "@/services/orders.service";
import { getRefund } from "@/services/refunds.service";
import type { OrderRefund } from "@/types/refund";

export function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const refundId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyPermission } = usePermission();
  const canView = hasAnyPermission([
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_ORDERS,
  ]);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_PAYMENTS);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeResult, setCompleteResult] = useState<OrderRefund | null>(
    null,
  );

  const refundQuery = useQuery({
    queryKey: queryKeys.refunds.detail(refundId),
    queryFn: () => getRefund(refundId),
    enabled: canView && Number.isFinite(refundId),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      completeOrderRefund(refundQuery.data!.orderId, refundId),
    onSuccess: (refund) => {
      setCompleteOpen(false);
      setCompleteResult(refund);
      void queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.refunds.detail(refundId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.refund(refund.orderId),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete refund",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrderRefund(refundQuery.data!.orderId, refundId),
    onSuccess: (refund) => {
      setCancelOpen(false);
      toast.success("Refund request cancelled");
      void queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.refunds.detail(refundId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.refund(refund.orderId),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel refund",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Refund" description="Refund details." />
        <EmptyState
          icon={RotateCcw}
          title="Access restricted"
          description="You do not have permission to view refunds."
        />
      </div>
    );
  }

  if (refundQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (refundQuery.isError || !refundQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Refund" description="Refund details." />
        <EmptyState
          icon={RotateCcw}
          title="Refund not found"
          description={
            refundQuery.error instanceof Error
              ? refundQuery.error.message
              : "Could not load this refund."
          }
        />
        <Link
          to="/refunds"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to refunds
        </Link>
      </div>
    );
  }

  const refund = refundQuery.data;
  const canComplete = canUpdate && refund.status === "INITIATED";
  const canCancel = canUpdate && refund.status === "INITIATED";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Refund #${refund.id}`}
        description={`${formatCurrency(refund.amount)} · ${refund.order.orderNumber}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/orders/${refund.orderId}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open order
            </Link>
            {canComplete && (
              <Button onClick={() => setCompleteOpen(true)}>
                Complete refund
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                Cancel request
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Refund details</CardTitle>
              <CardDescription>
                Refund lifecycle is separate from order fulfillment status.
              </CardDescription>
            </div>
            <StatusBadge variant={refundStatusVariants[refund.status]}>
              {refundStatusLabels[refund.status]}
            </StatusBadge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Payment amount</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(refund.paymentAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Refunded so far</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(refund.refundedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(refund.remainingAmount)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reason</p>
              <p className="mt-1">{refund.reason || "—"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Initiated</p>
                <p className="mt-1">
                  {refund.initiatedBy
                    ? [refund.initiatedBy.firstName, refund.initiatedBy.lastName]
                        .filter(Boolean)
                        .join(" ") || refund.initiatedBy.email
                    : `Staff #${refund.initiatedByStaffId}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(refund.initiatedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="mt-1">
                  {refund.completedBy
                    ? [refund.completedBy.firstName, refund.completedBy.lastName]
                        .filter(Boolean)
                        .join(" ") || refund.completedBy.email
                    : refund.completedByStaffId != null
                      ? `Staff #${refund.completedByStaffId}`
                      : "—"}
                </p>
                {refund.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(refund.completedAt)}
                  </p>
                )}
              </div>
            </div>
            {refund.razorpayRefundId && (
              <div>
                <p className="text-xs text-muted-foreground">Razorpay refund ID</p>
                <p className="mt-1 font-mono text-xs">{refund.razorpayRefundId}</p>
              </div>
            )}
            {refund.failureReason && (
              <div>
                <p className="text-xs text-muted-foreground">Failure reason</p>
                <p className="mt-1 text-destructive">{refund.failureReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Order number</p>
              <Link
                to={`/orders/${refund.order.id}`}
                className="mt-1 font-medium hover:underline"
              >
                {refund.order.orderNumber}
              </Link>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fulfillment status</p>
              <p className="mt-1">{getOrderStatusLabel(refund.order.status)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment ID</p>
              <p className="mt-1">#{refund.paymentId}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {refund.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {refund.events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {refundEventLabels[event.type] ?? event.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                  {event.message && (
                    <p className="mt-1 text-muted-foreground">{event.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete this refund?"
        description={`This calls Razorpay for ${formatCurrency(refund.amount)}. Order fulfillment status will not change.`}
        confirmLabel="Complete refund"
        cancelLabel="Back"
        variant="destructive"
        loading={completeMutation.isPending}
        onConfirm={() => completeMutation.mutateAsync()}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel refund request?"
        description="This only cancels the initiated request. No money is moved."
        confirmLabel="Cancel request"
        cancelLabel="Back"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutateAsync()}
      />

      <RefundCompleteResultDialog
        open={Boolean(completeResult)}
        onOpenChange={(open) => {
          if (!open) setCompleteResult(null);
        }}
        refund={completeResult}
      />
    </div>
  );
}
