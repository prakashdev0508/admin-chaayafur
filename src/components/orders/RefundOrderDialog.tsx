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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { InitiateRefundPayload } from "@/types/refund";

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 2000;

type RefundOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  remainingAmount: number;
  paymentAmountLabel: string;
  loading?: boolean;
  onConfirm: (payload: InitiateRefundPayload) => void | Promise<unknown>;
};

export function RefundOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  remainingAmount,
  paymentAmountLabel,
  loading = false,
  onConfirm,
}: RefundOrderDialogProps) {
  const remainingLabel = formatCurrency(remainingAmount);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(String(remainingAmount));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(String(remainingAmount));
      setReason("");
      setError(null);
    }
  }, [open, remainingAmount]);

  const trimmed = reason.trim();
  const reasonValid =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;

  const handleConfirm = async () => {
    if (!reasonValid) {
      setError(
        `Reason must be between ${MIN_REASON_LENGTH} and ${MAX_REASON_LENGTH} characters.`,
      );
      return;
    }

    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed < 0.01) {
      setError("Enter a refund amount of at least ₹0.01.");
      return;
    }
    if (parsed > remainingAmount + 0.001) {
      setError(`Amount cannot exceed remaining balance (${remainingLabel}).`);
      return;
    }

    const rounded = Math.round(parsed * 100) / 100;
    const isFullRemaining = Math.abs(rounded - remainingAmount) < 0.001;

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        reason: trimmed,
        ...(isFullRemaining ? {} : { amount: rounded }),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate refund</DialogTitle>
          <DialogDescription>
            Create a refund request for {orderNumber}. Payment total is{" "}
            {paymentAmountLabel}; remaining balance is {remainingLabel}. Leave
            the amount as remaining for a full refund, or enter a smaller amount
            for a partial refund. Razorpay is not charged until you click
            Complete refund.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Amount (₹) *</Label>
            <Input
              id="refund-amount"
              type="number"
              inputMode="decimal"
              min={0.01}
              max={remainingAmount}
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Max {remainingLabel}. Omit/use remaining for full remaining
              balance.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason *</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Damaged item — partial goodwill credit"
              rows={4}
              disabled={busy}
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
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={busy || !reasonValid}
          >
            {busy ? "Initiating..." : "Initiate refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
