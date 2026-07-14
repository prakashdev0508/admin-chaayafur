import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import {
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import type { OrderRefund } from "@/types/refund";

type RefundCompleteResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: OrderRefund | null;
  orderNumber: string;
};

function resultCopy(refund: OrderRefund) {
  if (refund.status === "PROCESSED") {
    return {
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      title: "Refund processed",
      description: `The refund for ${formatCurrency(refund.amount)} has been processed. The payment is marked refunded and the order status is Refunded.`,
    };
  }

  if (refund.status === "FAILED") {
    return {
      icon: CircleAlert,
      iconClass: "text-destructive",
      title: "Refund failed",
      description:
        refund.failureReason?.trim() ||
        "Razorpay reported a failure. You can review the timeline and try again if needed.",
    };
  }

  return {
    icon: Clock3,
    iconClass: "text-primary",
    title: "Refund submitted",
    description: `The refund for ${formatCurrency(refund.amount)} was submitted to Razorpay. Status will update to Processed when the gateway confirms it.`,
  };
}

export function RefundCompleteResultDialog({
  open,
  onOpenChange,
  refund,
  orderNumber,
}: RefundCompleteResultDialogProps) {
  if (!refund) return null;

  const copy = resultCopy(refund);
  const Icon = copy.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Icon
              className={`mt-0.5 size-6 shrink-0 ${copy.iconClass}`}
              aria-hidden
            />
            <div className="space-y-1.5">
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium">{orderNumber}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">
              {formatCurrency(refund.amount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge variant={refundStatusVariants[refund.status]}>
              {refundStatusLabels[refund.status]}
            </StatusBadge>
          </div>
          {refund.razorpayRefundId && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Razorpay ID</span>
              <span className="font-mono text-xs">
                {refund.razorpayRefundId}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
