import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupportTicketStatusBadge } from "@/components/support-tickets/SupportTicketStatusBadge";
import { SupportTicketThread } from "@/components/support-tickets/SupportTicketThread";
import { StaffReplyForm } from "@/components/support-tickets/StaffReplyForm";
import { ResolveTicketForm } from "@/components/support-tickets/ResolveTicketForm";
import { formatDate } from "@/lib/format";
import { isSupportTicketActive, supportTicketTypeLabels } from "@/lib/support-ticket-status";
import { queryKeys } from "@/lib/query-keys";
import {
  getSupportTicket,
  postSupportTicketMessage,
  updateSupportTicket,
} from "@/services/support-tickets.service";
import { usePermission } from "@/hooks/usePermission";
import type { UpdateSupportTicketPayload } from "@/types/support-ticket";
import { PERMISSIONS } from "@/lib/roles";

export function SupportTicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_ORDER_SUPPORT);

  const ticketQuery = useQuery({
    queryKey: queryKeys.supportTickets.detail(ticketId),
    queryFn: () => getSupportTicket(ticketId),
    enabled: Number.isFinite(ticketId) && hasPermission(PERMISSIONS.VIEW_ORDER_SUPPORT),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isSupportTicketActive(status) ? 5000 : false;
    },
  });

  const messageMutation = useMutation({
    mutationFn: (payload: Parameters<typeof postSupportTicketMessage>[1]) =>
      postSupportTicketMessage(ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets.detail(ticketId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSupportTicketPayload) =>
      updateSupportTicket(ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets.detail(ticketId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.all });
    },
  });

  const ticket = ticketQuery.data;
  const isEditable = ticket ? isSupportTicketActive(ticket.status) : false;

  if (ticketQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Ticket not found" />
        <Button variant="outline" render={<Link to="/support-tickets">Back to support</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={ticket.ticketNumber}
        description={ticket.subject}
        action={
          <Button
            variant="outline"
            render={
              <Link to="/support-tickets">
                <ArrowLeft className="size-4" />
                Back to support
              </Link>
            }
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Conversation</CardTitle>
                <SupportTicketStatusBadge status={ticket.status} />
              </div>
            </CardHeader>
            <CardContent>
              <SupportTicketThread messages={ticket.messages} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{supportTicketTypeLabels[ticket.type]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order</p>
                <Link
                  to={`/orders/${ticket.orderId}`}
                  className="font-medium hover:underline"
                >
                  {ticket.order.orderNumber}
                </Link>
              </div>
              {ticket.customer && (
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <Link
                    to={`/customers/${ticket.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {ticket.customer.phone}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {canUpdate && isEditable && (
            <>
              <StaffReplyForm
                loading={messageMutation.isPending}
                disabled={!isEditable}
                onSubmit={(payload) => messageMutation.mutateAsync(payload)}
              />
              <ResolveTicketForm
                loading={updateMutation.isPending}
                disabled={!isEditable}
                onSubmit={(payload) => updateMutation.mutateAsync(payload)}
              />
            </>
          )}

          {!canUpdate && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                You do not have permission to update support tickets.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
