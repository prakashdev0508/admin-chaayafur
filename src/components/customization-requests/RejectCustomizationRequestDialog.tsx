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
import type { RejectCustomizationRequestPayload } from "@/types/customization-request";

type RejectCustomizationRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: RejectCustomizationRequestPayload) => Promise<unknown>;
};

export function RejectCustomizationRequestDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: RejectCustomizationRequestDialogProps) {
  const [reason, setReason] = useState("");

  async function handleSubmit() {
    try {
      await onSubmit(
        reason.trim() ? { reason: reason.trim() } : {},
      );
      setReason("");
      onOpenChange(false);
      toast.success("Request rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject customization request</DialogTitle>
          <DialogDescription>
            The customer will see this request as rejected. You can optionally
            include a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="We cannot source this material at the requested size."
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
            {loading ? "Rejecting…" : "Reject request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
