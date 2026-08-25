/// <reference types="vitest" />
import { describe, expect, test } from "vitest";
import {
  amountInWordsInr,
  lineCgstAmount,
  lineDiscAmount,
  lineFinalAmount,
  lineSgstAmount,
  lineTotal,
  purchaseOrderTotals,
  validatePurchaseOrderDraft,
} from "@/lib/purchase-order";
import type { PurchaseOrderDraft, PurchaseOrderLine } from "@/types/purchase-order";

function sampleLine(overrides: Partial<PurchaseOrderLine> = {}): PurchaseOrderLine {
  return {
    id: "1",
    orderItemId: 1,
    description: "Signage Board repair",
    hsn: "",
    workCompDate: "",
    uom: "NOS",
    quantity: 1,
    basicAmount: 49000,
    discPercent: 0,
    cgstPercent: 9,
    sgstPercent: 9,
    ...overrides,
  };
}

function emptyDraft(items: PurchaseOrderLine[]): PurchaseOrderDraft {
  return {
    poNumber: "PO-20260825-1000",
    date: "2026-08-25",
    companyLegal: {
      pan: "",
      cin: "",
      address: "",
    },
    vendor: {
      name: "Unique Ads Media",
      address: "",
      gstin: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
    shipTo: {
      name: "Chaaya Furnitures",
      unitName: "",
      address: "",
      state: "",
      gstin: "",
      phone: "",
      email: "",
    },
    billTo: {
      name: "Chaaya Furnitures",
      unitName: "",
      address: "",
      state: "",
      gstin: "",
      phone: "",
      email: "",
    },
    items,
    terms: [],
  };
}

describe("purchase-order math", () => {
  test("computes discount, GST split, and row total", () => {
    const item = sampleLine({ basicAmount: 10000, discPercent: 10 });
    expect(lineDiscAmount(item)).toBe(1000);
    expect(lineFinalAmount(item)).toBe(9000);
    expect(lineCgstAmount(item)).toBe(810);
    expect(lineSgstAmount(item)).toBe(810);
    expect(lineTotal(item)).toBe(10620);
  });

  test("aggregates document totals", () => {
    const totals = purchaseOrderTotals([
      sampleLine({ basicAmount: 49000 }),
    ]);
    expect(totals.totalBasic).toBe(49000);
    expect(totals.totalTaxable).toBe(49000);
    expect(totals.totalTax).toBe(8820);
    expect(totals.netAmount).toBe(57820);
  });

  test("amountInWordsInr for net amount", () => {
    expect(amountInWordsInr(57820)).toBe(
      "FIFTY SEVEN THOUSAND EIGHT HUNDRED TWENTY RUPEES",
    );
    expect(amountInWordsInr(0)).toBe("ZERO RUPEES");
  });

  test("validatePurchaseOrderDraft requires vendor and items", () => {
    const draft = emptyDraft([]);
    draft.vendor.name = "";
    expect(validatePurchaseOrderDraft(draft)).toMatch(/vendor name/i);

    draft.vendor.name = "Vendor";
    expect(validatePurchaseOrderDraft(draft)).toMatch(/at least one/i);

    draft.items = [sampleLine()];
    expect(validatePurchaseOrderDraft(draft)).toBeNull();
  });
});
