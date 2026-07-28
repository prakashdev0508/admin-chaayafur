import { StatusBadge } from "@/components/ui/status-badge";
import {
  customizationRequestStatusLabels,
  customizationRequestStatusVariants,
} from "@/lib/customization-request-status";
import type { CustomizationRequestStatus } from "@/types/customization-request";

type CustomizationRequestStatusBadgeProps = {
  status: CustomizationRequestStatus;
};

export function CustomizationRequestStatusBadge({
  status,
}: CustomizationRequestStatusBadgeProps) {
  return (
    <StatusBadge variant={customizationRequestStatusVariants[status]}>
      {customizationRequestStatusLabels[status]}
    </StatusBadge>
  );
}
