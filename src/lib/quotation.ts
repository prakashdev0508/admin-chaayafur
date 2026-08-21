import type {
  CreateQuotationPayload,
  Quotation,
  QuotationDraft,
  QuotationLineItem,
  QuotationPdfUploadResult,
  QuotationStatus,
} from "@/types/quotation";
import type { StatusVariant } from "@/lib/status-variants";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const QUOTATION_COMPANY_NAME = "Chaaya Furnitures";
export const QUOTATION_VALIDITY_DAYS = 15;
/** Catalog prices are GST-inclusive, same as invoices. */
export const QUOTATION_GST_RATE = 0.18;

export function createQuoteNumber(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `QT-${y}${m}${d}-${suffix}`;
}

export function defaultValidUntil(now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + QUOTATION_VALIDITY_DAYS);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createEmptyQuotationDraft(): QuotationDraft {
  return {
    quoteNumber: createQuoteNumber(),
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    validUntil: defaultValidUntil(),
    notes: "",
    items: [],
  };
}

export function lineTotal(item: Pick<QuotationLineItem, "quantity" | "unitPrice">) {
  return roundMoney(item.quantity * item.unitPrice);
}

export function taxableAmount(inclusive: number, rate = QUOTATION_GST_RATE) {
  return roundMoney(inclusive / (1 + rate));
}

export function gstAmount(inclusive: number, rate = QUOTATION_GST_RATE) {
  return roundMoney(inclusive - taxableAmount(inclusive, rate));
}

export function grandTotal(items: QuotationLineItem[]) {
  return roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function quotationTotals(items: QuotationLineItem[]) {
  const inclusive = grandTotal(items);
  const taxable = roundMoney(
    items.reduce((sum, item) => sum + taxableAmount(lineTotal(item)), 0),
  );
  const gst = roundMoney(inclusive - taxable);
  return { inclusive, taxable, gst };
}

export function formatQuoteAmount(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(safe);
}

export function formatQuoteRupees(amount: string | number) {
  return `Rs ${formatQuoteAmount(amount)}`;
}

export function parseUnitPrice(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return roundMoney(Math.max(0, parsed));
}

export function isValidIndianMobile(phone: string) {
  return INDIAN_MOBILE.test(phone.trim());
}

export function isValidEmail(email: string) {
  return EMAIL.test(email.trim());
}

export function formatQuoteBannerDate(date = new Date()) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  return `${months[date.getMonth()]}-${day}, ${date.getFullYear()}`;
}

export function formatQuoteDateTime(date = new Date()) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatQuoteDate(isoDate: string) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function validateQuotationDraft(draft: QuotationDraft): string | null {
  const name = draft.customerName.trim();
  if (!name) return "Enter the customer name.";
  if (!isValidIndianMobile(draft.customerPhone)) {
    return "Enter a valid 10-digit mobile number.";
  }
  if (!draft.customerEmail.trim() || !isValidEmail(draft.customerEmail)) {
    return "Enter a valid email address.";
  }
  if (!draft.customerAddress.trim()) {
    return "Enter the customer address.";
  }
  if (!draft.validUntil.trim()) {
    return "Choose a valid-until date.";
  }
  if (draft.items.length === 0) return "Add at least one product.";
  for (const item of draft.items) {
    // If productId is missing, treat it as an off-catalog custom line.
    if (item.productId == null || item.productId === 0) {
      if (!item.productName.trim()) {
        return "Custom item name is required.";
      }
    } else {
      if (!Number.isFinite(item.productId)) {
        return `Invalid product id for ${item.productName}.`;
      }
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return `Quantity for ${item.productName} must be at least 1.`;
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      return `Price for ${item.productName} must be 0 or more.`;
    }
  }
  return null;
}

/** End of the calendar day in IST (UTC+05:30). */
export function validUntilDateToIso(dateYmd: string) {
  return new Date(`${dateYmd}T23:59:59.999+05:30`).toISOString();
}

export function isoToValidUntilDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function quotationToDraft(quotation: Quotation): QuotationDraft {
  return {
    quoteNumber: quotation.quotationNumber,
    customerName: quotation.customerName,
    customerPhone: quotation.mobileNumber,
    customerEmail: quotation.email,
    customerAddress: quotation.address,
    validUntil: isoToValidUntilDate(quotation.validUntil),
    notes: quotation.notes ?? "",
    items: quotation.products.map((product) => ({
      id: String(product.id),
      productId: product.productId ?? null,
      productName: product.productName,
      imageUrl: product.productImageUrl ?? null,
      imageStorageKey: product.productImageKey ?? null,
      quantity: product.quantity,
      unitPrice: Number.parseFloat(product.price) || 0,
    })),
  };
}

export function draftToCreatePayload(
  draft: QuotationDraft,
  pdf: QuotationPdfUploadResult,
): CreateQuotationPayload {
  const totals = quotationTotals(draft.items);
  return {
    customerName: draft.customerName.trim(),
    mobileNumber: draft.customerPhone.trim(),
    email: draft.customerEmail.trim().toLowerCase(),
    validUntil: validUntilDateToIso(draft.validUntil),
    address: draft.customerAddress.trim(),
    notes: draft.notes.trim() || undefined,
    pdfUrl: pdf.url,
    pdfStorageKey: pdf.key,
    products: draft.items.map((item) => {
      const hasLineImage =
        Boolean(item.imageUrl) && Boolean(item.imageStorageKey);
      const image = hasLineImage
        ? {
            url: item.imageUrl!,
            storageKey: item.imageStorageKey!,
          }
        : undefined;

      if (item.productId == null || item.productId === 0) {
        return {
          type: "CUSTOM",
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          ...(image ? { image } : {}),
        } as const;
      }

      return {
        type: "CATALOG",
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
        ...(image ? { image } : {}),
      } as const;
    }),
    totalPrice: totals.inclusive,
    gstAmount: totals.gst,
  };
}

export const QUOTATION_STATUS_ITEMS: Array<{
  value: QuotationStatus;
  label: string;
}> = [
  { value: "SENT", label: "Sent" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "CLOSED", label: "Closed" },
  { value: "CONVERTED", label: "Converted" },
];

export function quotationStatusLabel(status: QuotationStatus) {
  return (
    QUOTATION_STATUS_ITEMS.find((item) => item.value === status)?.label ??
    status
  );
}

export function quotationStatusVariant(
  status: QuotationStatus,
): StatusVariant {
  switch (status) {
    case "SENT":
      return "brand";
    case "FOLLOW_UP":
      return "warning";
    case "CLOSED":
      return "neutral";
    case "CONVERTED":
      return "success";
    default:
      return "default";
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
