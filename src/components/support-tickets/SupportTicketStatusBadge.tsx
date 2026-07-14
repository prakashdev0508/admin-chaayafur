import { StatusBadge } from "@/components/ui/status-badge";
import {
  supportTicketStatusLabels,
  supportTicketStatusVariants,
} from "@/lib/support-ticket-status";
import type { SupportTicketStatus } from "@/types/support-ticket";

type SupportTicketStatusBadgeProps = {
  status: SupportTicketStatus;
};

export function SupportTicketStatusBadge({ status }: SupportTicketStatusBadgeProps) {
  return (
    <StatusBadge variant={supportTicketStatusVariants[status]}>
      {supportTicketStatusLabels[status]}
    </StatusBadge>
  );
}
