import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 2000;

type RefundOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  amountLabel: string;
  loading?: boolean;
  onConfirm: (reason: string) => void | Promise<unknown>;
};

export function RefundOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  amountLabel,
  loading = false,
  onConfirm,
}: RefundOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = reason.trim();
  const isValid =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;

  const handleConfirm = async () => {
    if (!isValid) {
      setError(
        `Reason must be between ${MIN_REASON_LENGTH} and ${MAX_REASON_LENGTH} characters.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading && !submitting) {
          onOpenChange(next);
          if (!next) {
            setReason("");
            setError(null);
          }
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate refund</DialogTitle>
          <DialogDescription>
            Start a full refund of {amountLabel} for {orderNumber}. This only
            creates a refund request — Razorpay is not charged until you click
            Complete refund. Cancelling an order alone does not refund.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="refund-reason">Reason *</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Customer requested cancellation after delivery delay"
            rows={4}
            disabled={loading || submitting}
            maxLength={MAX_REASON_LENGTH}
          />
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Required · at least {MIN_REASON_LENGTH} characters
            </span>
            <span>
              {trimmed.length}/{MAX_REASON_LENGTH}
            </span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={loading || submitting || !isValid}
          >
            {loading || submitting ? "Initiating..." : "Initiate refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
