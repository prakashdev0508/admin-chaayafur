import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  isActiveRefund,
  refundEventLabels,
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import type { OrderRefund, RefundStatus } from "@/types/refund";

type RefundPanelProps = {
  refund: OrderRefund;
  canUpdate: boolean;
  completeLoading?: boolean;
  cancelLoading?: boolean;
  onComplete: () => void;
  onCancel: () => void;
};

function statusLabel(status: string) {
  return refundStatusLabels[status as RefundStatus] ?? status;
}

function statusVariant(status: string) {
  return refundStatusVariants[status as RefundStatus] ?? "neutral";
}

export function RefundPanel({
  refund,
  canUpdate,
  completeLoading,
  cancelLoading,
  onComplete,
  onCancel,
}: RefundPanelProps) {
  const busy = Boolean(completeLoading || cancelLoading);
  const canComplete = canUpdate && refund.status === "INITIATED";
  const canCancelRequest = canUpdate && refund.status === "INITIATED";
  const events = Array.isArray(refund.events) ? refund.events : [];

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Refund #{refund.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(refund.amount)}
          </p>
        </div>
        <StatusBadge variant={statusVariant(refund.status)}>
          {statusLabel(refund.status)}
        </StatusBadge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge variant={statusVariant(refund.status)}>
            {statusLabel(refund.status)}
          </StatusBadge>
        </div>
        <div>
          <p className="text-muted-foreground">Reason</p>
          <p>{refund.reason || "—"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Initiated</p>
            <p>{refund.initiatedAt ? formatDate(refund.initiatedAt) : "—"}</p>
          </div>
          {refund.completedAt && (
            <div>
              <p className="text-muted-foreground">Complete clicked</p>
              <p>{formatDate(refund.completedAt)}</p>
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

      {events.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Timeline</p>
            <ol className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="relative pl-4 text-sm">
                  <span className="absolute top-1.5 left-0 size-1.5 rounded-full bg-foreground/40" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {refundEventLabels[event.type] ?? event.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  {event.message && (
                    <p className="mt-0.5 text-muted-foreground">{event.message}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.actorType}
                    {event.actorId != null ? ` #${event.actorId}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {isActiveRefund(refund.status as RefundStatus) && (
        <p className="text-xs text-muted-foreground">
          Payment stays completed until the refund is processed. Order cancel
          and stock restore happen only when the refund is processed.
        </p>
      )}
    </div>
  );
}
