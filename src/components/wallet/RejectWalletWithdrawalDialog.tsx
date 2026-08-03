import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RejectWalletWithdrawalPayload } from "@/types/wallet";

type RejectWalletWithdrawalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: RejectWalletWithdrawalPayload) => Promise<unknown>;
};

export function RejectWalletWithdrawalDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: RejectWalletWithdrawalDialogProps) {
  const [reason, setReason] = useState("");

  async function handleSubmit() {
    try {
      await onSubmit(reason.trim() ? { reason: reason.trim() } : {});
      setReason("");
      onOpenChange(false);
      toast.success("Withdrawal rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject withdrawal",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject withdrawal</DialogTitle>
          <DialogDescription>
            Funds become available again for the customer. You can optionally
            include a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wallet-reject-reason">Reason (optional)</Label>
          <Textarea
            id="wallet-reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Invalid payout details"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => void handleSubmit()}
          >
            {loading ? "Rejecting…" : "Reject withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
