import type { StatusVariant } from "@/lib/status-variants";

/** Collection mode for MANUAL installments (mark-paid). */
export type ManualPaymentMode =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "RAZORPAY"
  | "CHEQUE"
  | "OTHER";

export const MANUAL_PAYMENT_MODES: ManualPaymentMode[] = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "RAZORPAY",
  "CHEQUE",
  "OTHER",
];

export const manualPaymentModeLabels: Record<ManualPaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  RAZORPAY: "Razorpay",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export const MANUAL_PAYMENT_MODE_ITEMS = MANUAL_PAYMENT_MODES.map((value) => ({
  value,
  label: manualPaymentModeLabels[value],
}));

export function formatManualPaymentMode(mode: string | null | undefined) {
  if (!mode) return "—";
  if (mode in manualPaymentModeLabels) {
    return manualPaymentModeLabels[mode as ManualPaymentMode];
  }
  return mode;
}

export function isManualPaymentMode(value: string): value is ManualPaymentMode {
  return (MANUAL_PAYMENT_MODES as string[]).includes(value);
}

export const manualPaymentModeVariants: Record<
  ManualPaymentMode,
  StatusVariant
> = {
  CASH: "success",
  UPI: "brand",
  BANK_TRANSFER: "neutral",
  RAZORPAY: "brand",
  CHEQUE: "warning",
  OTHER: "default",
};
