import type { CustomizationRequestStatus } from "@/types/customization-request";
import type { StatusVariant } from "@/lib/status-variants";

export const customizationRequestStatusLabels: Record<
  CustomizationRequestStatus,
  string
> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
};

export const customizationRequestStatusVariants: Record<
  CustomizationRequestStatus,
  StatusVariant
> = {
  PENDING: "warning",
  APPROVED: "brand",
  REJECTED: "danger",
  CONVERTED: "success",
};

export function canEditCustomizationRequest(
  status: CustomizationRequestStatus,
): boolean {
  return status !== "CONVERTED";
}

export function canApproveCustomizationRequest(
  status: CustomizationRequestStatus,
): boolean {
  return status === "PENDING";
}

export function canRejectCustomizationRequest(
  status: CustomizationRequestStatus,
): boolean {
  return status === "PENDING" || status === "APPROVED";
}

export function canConvertCustomizationRequest(
  status: CustomizationRequestStatus,
): boolean {
  return status === "APPROVED";
}
