import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import { formatStaffName } from "@/lib/staff-utils";
import type {
  OrderRefund,
  OrderRefundsResponse,
  RefundStaffSummary,
  RefundStatus,
} from "@/types/refund";

type RefundPanelProps = {
  data: OrderRefundsResponse;
  canUpdate: boolean;
  completeLoading?: boolean;
  cancelLoading?: boolean;
  onComplete: (refund: OrderRefund) => void;
  onCancel: (refund: OrderRefund) => void;
};

function statusLabel(status: string) {
  return refundStatusLabels[status as RefundStatus] ?? status;
}

function statusVariant(status: string) {
  return refundStatusVariants[status as RefundStatus] ?? "neutral";
}

function refundActorLabel(
  staff: RefundStaffSummary | null | undefined,
  staffId: number | null | undefined,
) {
  if (staff) return formatStaffName(staff);
  if (staffId != null) return `Staff #${staffId}`;
  return "—";
}

function RefundItemCard({
  refund,
  canUpdate,
  completeLoading,
  cancelLoading,
  onComplete,
  onCancel,
}: {
  refund: OrderRefund;
  canUpdate: boolean;
  completeLoading?: boolean;
  cancelLoading?: boolean;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const busy = Boolean(completeLoading || cancelLoading);
  const canComplete = canUpdate && refund.status === "INITIATED";
  const canCancelRequest = canUpdate && refund.status === "INITIATED";

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/refunds/${refund.id}`}
            className="text-sm font-medium hover:underline"
          >
            Refund #{refund.id}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(refund.amount)}
          </p>
        </div>
        <StatusBadge variant={statusVariant(refund.status)}>
          {statusLabel(refund.status)}
        </StatusBadge>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-muted-foreground">Reason</p>
          <p>{refund.reason || "—"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Initiated by</p>
            <p>
              {refundActorLabel(
                refund.initiatedBy,
                refund.initiatedByStaffId,
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {refund.initiatedAt ? formatDate(refund.initiatedAt) : "—"}
            </p>
          </div>
          {(refund.completedBy ||
            refund.completedByStaffId != null ||
            refund.completedAt) && (
            <div>
              <p className="text-muted-foreground">Completed by</p>
              <p>
                {refundActorLabel(
                  refund.completedBy,
                  refund.completedByStaffId,
                )}
              </p>
              {refund.completedAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(refund.completedAt)}
                </p>
              )}
            </div>
          )}
          {refund.processedAt && (
            <div>
              <p className="text-muted-foreground">Processed</p>
              <p>{formatDate(refund.processedAt)}</p>
            </div>
          )}
          {refund.failedAt && (
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p>{formatDate(refund.failedAt)}</p>
            </div>
          )}
        </div>
        {refund.razorpayRefundId && (
          <div>
            <p className="text-muted-foreground">Razorpay refund ID</p>
            <p className="font-mono text-xs">{refund.razorpayRefundId}</p>
          </div>
        )}
        {refund.failureReason && (
          <div>
            <p className="text-muted-foreground">Failure reason</p>
            <p className="text-destructive">{refund.failureReason}</p>
          </div>
        )}
        {refund.status === "PROCESSING" && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Waiting for Razorpay to finalize the refund…
          </p>
        )}
      </div>

      {(canComplete || canCancelRequest) && (
        <div className="flex flex-wrap gap-2">
          {canComplete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={onComplete}
            >
              {completeLoading ? "Completing..." : "Complete refund"}
            </Button>
          )}
          {canCancelRequest && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onCancel}
            >
              {cancelLoading ? "Cancelling..." : "Cancel request"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function RefundPanel({
  data,
  canUpdate,
  completeLoading,
  cancelLoading,
  onComplete,
  onCancel,
}: RefundPanelProps) {
  const items =
    Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : data.id
        ? [data]
        : [];
  const remaining = parseFloat(data.remainingAmount ?? "0");
  const refunded = parseFloat(data.refundedAmount ?? "0");
  const paymentTotal = parseFloat(
    data.paymentAmount ?? data.amount ?? "0",
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Payment total</p>
          <p className="mt-1 text-sm font-medium">
            {formatCurrency(paymentTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Refunded</p>
          <p className="mt-1 text-sm font-medium">{formatCurrency(refunded)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="mt-1 text-sm font-medium">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Payment stays completed until fully refunded. Stock and coupon restore
        only when remaining balance reaches zero.
      </p>

      <div className="space-y-3">
        {items.map((refund) => (
          <RefundItemCard
            key={refund.id}
            refund={refund}
            canUpdate={canUpdate}
            completeLoading={completeLoading}
            cancelLoading={cancelLoading}
            onComplete={() => onComplete(refund)}
            onCancel={() => onCancel(refund)}
          />
        ))}
      </div>
    </div>
  );
}
