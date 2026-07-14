import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SupportImageUploader } from "@/components/shop/SupportImageUploader";
import { SupportTicketThread } from "@/components/support-tickets/SupportTicketThread";
import { SupportTicketStatusBadge } from "@/components/support-tickets/SupportTicketStatusBadge";
import { ApiError } from "@/lib/api";
import { canCustomerReply, isSupportTicketActive } from "@/lib/support-ticket-status";
import { queryKeys } from "@/lib/query-keys";
import {
  getShopSupportTicket,
  replyToSupportTicket,
} from "@/services/shop-support-tickets.service";
import type { SupportTicketAttachment } from "@/types/support-ticket";

type SupportTicketDetailSheetProps = {
  ticketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
};

export function SupportTicketDetailSheet({
  ticketId,
  open,
  onOpenChange,
  orderId,
}: SupportTicketDetailSheetProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);

  const ticketQuery = useQuery({
    queryKey: queryKeys.shop.supportTickets.detail(ticketId ?? 0),
    queryFn: () => getShopSupportTicket(ticketId!),
    enabled: open && ticketId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isSupportTicketActive(status) ? 5000 : false;
    },
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToSupportTicket(ticketId!, {
        message: message.trim(),
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.supportTickets.detail(ticketId!),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.supportTickets.byOrder(orderId),
      });
      setMessage("");
      setAttachments([]);
      toast.success("Reply sent");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not send reply");
    },
  });

  const ticket = ticketQuery.data;
  const canReply = ticket ? canCustomerReply(ticket.status) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{ticket?.ticketNumber ?? "Support ticket"}</SheetTitle>
          <SheetDescription>{ticket?.subject}</SheetDescription>
        </SheetHeader>

        {ticketQuery.isLoading ? (
          <p className="px-4 text-sm text-muted-foreground">Loading ticket...</p>
        ) : ticket ? (
          <div className="space-y-6 px-4 pb-6">
            <div className="flex items-center justify-between gap-3">
              <SupportTicketStatusBadge status={ticket.status} />
              <span className="text-xs text-muted-foreground">
                {ticket.type === "PROBLEM" ? "Problem report" : "Question"}
              </span>
            </div>

            {!canReply && isSupportTicketActive(ticket.status) && (
              <div className="rounded-lg border border-[#E8DFD3] bg-[#F8F1E8] p-3 text-sm text-muted-foreground">
                {ticket.status === "AWAITING_STAFF"
                  ? "Our team is reviewing your ticket. You can reply once they ask a follow-up question."
                  : "This ticket is waiting for staff action."}
              </div>
            )}

            {!isSupportTicketActive(ticket.status) && (
              <div className="rounded-lg border border-[#E8DFD3] bg-[#F3EBE0] p-3 text-sm text-muted-foreground">
                This ticket is {ticket.status.toLowerCase()} and no longer accepts replies.
              </div>
            )}

            <SupportTicketThread messages={ticket.messages} />

            {canReply && (
              <div className="space-y-4 rounded-xl border border-[#E8DFD3] bg-white p-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-reply">Your reply</Label>
                  <Textarea
                    id="customer-reply"
                    value={message}
                    maxLength={2000}
                    rows={4}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Here is the close-up photo you requested."
                  />
                </div>
                <SupportImageUploader
                  attachments={attachments}
                  onChange={setAttachments}
                />
                <Button
                  className="w-full bg-[#8B5E3C] hover:bg-[#744C31]"
                  disabled={replyMutation.isPending || !message.trim()}
                  onClick={() => replyMutation.mutate()}
                >
                  {replyMutation.isPending ? "Sending..." : "Send reply"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">Ticket not found.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
