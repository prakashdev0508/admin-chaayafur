import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SupportImageUploader } from "@/components/shop/SupportImageUploader";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { createOrderSupportTicket } from "@/services/shop-support-tickets.service";
import type {
  SupportTicketAttachment,
  SupportTicketType,
} from "@/types/support-ticket";

type CreateSupportTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  type: SupportTicketType;
  onCreated: (ticketId: number) => void;
};

export function CreateSupportTicketDialog({
  open,
  onOpenChange,
  orderId,
  type,
  onCreated,
}: CreateSupportTicketDialogProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);

  const createMutation = useMutation({
    mutationFn: () =>
      createOrderSupportTicket(orderId, {
        type,
        subject: subject.trim(),
        message: message.trim(),
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.supportTickets.byOrder(orderId),
      });
      toast.success("Support ticket created");
      setSubject("");
      setMessage("");
      setAttachments([]);
      onOpenChange(false);
      onCreated(ticket.id);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not create ticket");
    },
  });

  function handleSubmit() {
    if (!subject.trim()) {
      toast.error("Enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Enter a message");
      return;
    }
    if (type === "PROBLEM" && attachments.length === 0) {
      toast.error("Add at least one proof image for problem reports");
      return;
    }
    createMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E8DFD3] bg-[#FAF7F2] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {type === "PROBLEM" ? "Report a problem" : "Ask a question"}
          </DialogTitle>
          <DialogDescription>
            {type === "PROBLEM"
              ? "Describe the issue and attach proof photos so our team can help."
              : "Tell us what you need help with regarding this order."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              maxLength={120}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Damaged chair leg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-message">Message</Label>
            <Textarea
              id="ticket-message"
              value={message}
              maxLength={2000}
              rows={5}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="One leg arrived cracked during delivery."
            />
          </div>

          <SupportImageUploader
            attachments={attachments}
            onChange={setAttachments}
            required={type === "PROBLEM"}
          />

          <Button
            className="w-full bg-[#8B5E3C] hover:bg-[#744C31]"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? "Submitting..." : "Submit ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
