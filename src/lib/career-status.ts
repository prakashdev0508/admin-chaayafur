import type { StatusVariant } from "@/lib/status-variants";
import type { CareerApplicationStatus } from "@/types/career";

export const careerStatusLabels: Record<CareerApplicationStatus, string> = {
  PENDING: "Pending",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

export const careerStatusVariants: Record<CareerApplicationStatus, StatusVariant> =
  {
    PENDING: "warning",
    SHORTLISTED: "brand",
    REJECTED: "danger",
    HIRED: "success",
  };
