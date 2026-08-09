import { useEffect, useState } from "react";
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

type CancelOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  loading?: boolean;
  onConfirm: (cancellationReason: string) => void | Promise<unknown>;
};

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  loading = false,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const trimmed = reason.trim();
  const reasonValid =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;
  const busy = loading || submitting;

  const handleConfirm = async () => {
    if (!reasonValid) {
      setError(
        `Cancellation reason must be between ${MIN_REASON_LENGTH} and ${MAX_REASON_LENGTH} characters.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel order",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order {orderNumber}?</DialogTitle>
          <DialogDescription>
            This order will be cancelled and cannot be modified further. Stock
            for line items will be restored. This action cannot be undone from
            the order status flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancellation-reason">
            Cancellation reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cancellation-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Customer requested cancellation"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            disabled={busy}
            aria-required
          />
          <p className="text-xs text-muted-foreground">
            Required · at least {MIN_REASON_LENGTH} characters
            {trimmed.length > 0 ? ` · ${trimmed.length} entered` : ""}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Keep order
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={busy || !reasonValid}
          >
            {busy ? "Cancelling..." : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
