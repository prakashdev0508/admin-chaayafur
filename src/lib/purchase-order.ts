import type { Order, OrderItem } from "@/types/order";
import type { PublicSiteSettings } from "@/types/site-settings";
import type {
  PurchaseOrderCompanyLegal,
  PurchaseOrderDraft,
  PurchaseOrderLine,
  PurchaseOrderParty,
  PurchaseOrderVendor,
} from "@/types/purchase-order";

export const PO_COMPANY_NAME = "Chaaya Furnitures";
export const PO_DEFAULT_CGST_PERCENT = 9;
export const PO_DEFAULT_SGST_PERCENT = 9;
export const PO_DEFAULT_UOM = "NOS";

const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];
const TENS = [
  "",
  "",
  "TWENTY",
  "THIRTY",
  "FORTY",
  "FIFTY",
  "SIXTY",
  "SEVENTY",
  "EIGHTY",
  "NINETY",
];

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function createPoNumber(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${y}${m}${d}-${suffix}`;
}

export function todayYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatPoDate(ymd: string) {
  if (!ymd) return "";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return ymd;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function formatPoAmount(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(safe);
}

export function formatPoRupees(amount: string | number) {
  return `Rs ${formatPoAmount(amount)}`;
}

export function parseMoney(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return roundMoney(Math.max(0, parsed));
}

export function emptyVendor(): PurchaseOrderVendor {
  return {
    name: "",
    address: "",
    gstin: "",
    contactPerson: "",
    phone: "",
    email: "",
  };
}

export function emptyParty(): PurchaseOrderParty {
  return {
    name: PO_COMPANY_NAME,
    unitName: "",
    address: "",
    state: "",
    gstin: "",
    phone: "",
    email: "",
  };
}

export function emptyCompanyLegal(): PurchaseOrderCompanyLegal {
  return {
    pan: "",
    cin: "",
    address: "",
  };
}

export function partyFromSiteSettings(
  settings?: PublicSiteSettings | null,
): PurchaseOrderParty {
  return {
    name: PO_COMPANY_NAME,
    unitName: "Showroom",
    address: settings?.showroomAddress?.trim() ?? "",
    state: "",
    gstin: settings?.gstin?.trim() ?? "",
    phone: settings?.phone?.trim() ?? "",
    email: settings?.email?.trim() ?? "",
  };
}

export function orderItemLabel(item: OrderItem) {
  const name = item.product?.name ?? item.productName ?? "Custom item";
  const parts: string[] = [name];
  const wood = item.woodName ?? item.wood?.name;
  const polish = item.polishName ?? item.polish?.name;
  const fabric = item.fabricName ?? item.fabric?.name;
  if (wood) parts.push(`Wood: ${wood}`);
  if (polish) parts.push(`Polish: ${polish}`);
  if (fabric) parts.push(`Fabric: ${fabric}`);
  for (const option of item.customization ?? []) {
    if (option.groupName && option.value) {
      parts.push(`${option.groupName}: ${option.value}`);
    } else if (option.value) {
      parts.push(option.value);
    }
  }
  return parts.join(" · ");
}

export function orderItemToPoLine(item: OrderItem): PurchaseOrderLine {
  return {
    id: `oi-${item.id}`,
    orderItemId: item.id,
    description: orderItemLabel(item),
    hsn: "",
    workCompDate: "",
    uom: PO_DEFAULT_UOM,
    quantity: item.quantity,
    basicAmount: parseMoney(item.price),
    discPercent: 0,
    cgstPercent: PO_DEFAULT_CGST_PERCENT,
    sgstPercent: PO_DEFAULT_SGST_PERCENT,
  };
}

export function createPurchaseOrderDraft(
  order: Order,
  settings?: PublicSiteSettings | null,
): PurchaseOrderDraft {
  const party = partyFromSiteSettings(settings);
  return {
    poNumber: createPoNumber(),
    date: todayYmd(),
    companyLegal: {
      ...emptyCompanyLegal(),
      pan: settings?.pan?.trim() ?? "",
      cin: settings?.cin?.trim() ?? "",
      address: settings?.showroomAddress?.trim() ?? "",
    },
    vendor: emptyVendor(),
    shipTo: { ...party },
    billTo: { ...party },
    items: order.items.map(orderItemToPoLine),
    terms: [],
  };
}

export function lineBasicValue(item: PurchaseOrderLine) {
  return roundMoney(item.quantity * item.basicAmount);
}

export function lineDiscAmount(item: PurchaseOrderLine) {
  return roundMoney(lineBasicValue(item) * (item.discPercent / 100));
}

export function lineFinalAmount(item: PurchaseOrderLine) {
  return roundMoney(lineBasicValue(item) - lineDiscAmount(item));
}

export function lineCgstAmount(item: PurchaseOrderLine) {
  return roundMoney(lineFinalAmount(item) * (item.cgstPercent / 100));
}

export function lineSgstAmount(item: PurchaseOrderLine) {
  return roundMoney(lineFinalAmount(item) * (item.sgstPercent / 100));
}

export function lineTotal(item: PurchaseOrderLine) {
  return roundMoney(
    lineFinalAmount(item) + lineCgstAmount(item) + lineSgstAmount(item),
  );
}

export function purchaseOrderTotals(items: PurchaseOrderLine[]) {
  const totalBasic = roundMoney(
    items.reduce((sum, item) => sum + lineBasicValue(item), 0),
  );
  const totalTaxable = roundMoney(
    items.reduce((sum, item) => sum + lineFinalAmount(item), 0),
  );
  const totalTax = roundMoney(
    items.reduce(
      (sum, item) => sum + lineCgstAmount(item) + lineSgstAmount(item),
      0,
    ),
  );
  const netAmount = roundMoney(totalTaxable + totalTax);
  return { totalBasic, totalTaxable, totalTax, netAmount };
}

function twoDigitWords(n: number) {
  if (n < 20) return ONES[n] ?? "";
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return [TENS[ten], ONES[one]].filter(Boolean).join(" ");
}

function threeDigitWords(n: number) {
  if (n === 0) return "";
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred > 0) parts.push(`${ONES[hundred]} HUNDRED`);
  if (rest > 0) parts.push(twoDigitWords(rest));
  return parts.join(" ");
}

/** Convert a non-negative INR amount to uppercase words (no paise). */
export function amountInWordsInr(amount: number) {
  const rupees = Math.floor(Math.abs(roundMoney(amount)));
  if (rupees === 0) return "ZERO RUPEES";

  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigitWords(crore)} CRORE`);
  if (lakh > 0) parts.push(`${threeDigitWords(lakh)} LAKH`);
  if (thousand > 0) parts.push(`${threeDigitWords(thousand)} THOUSAND`);
  if (hundred > 0) parts.push(threeDigitWords(hundred));

  return `${parts.join(" ").replace(/\s+/g, " ").trim()} RUPEES`;
}

export function validatePurchaseOrderDraft(
  draft: PurchaseOrderDraft,
): string | null {
  if (!draft.vendor.name.trim()) return "Enter the vendor name.";
  if (draft.items.length === 0) {
    return "Select at least one order item for the purchase order.";
  }
  for (const item of draft.items) {
    if (!item.description.trim()) {
      return "Each line needs a description.";
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return `Quantity for "${item.description}" must be at least 1.`;
    }
    if (!Number.isFinite(item.basicAmount) || item.basicAmount < 0) {
      return `Basic amount for "${item.description}" must be 0 or more.`;
    }
    if (!Number.isFinite(item.discPercent) || item.discPercent < 0) {
      return `Discount % for "${item.description}" must be 0 or more.`;
    }
  }
  return null;
}
