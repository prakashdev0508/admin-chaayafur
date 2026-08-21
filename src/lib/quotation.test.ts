/// <reference types="vitest" />
import { describe, expect, test } from "vitest";
import {
  createEmptyQuotationDraft,
  draftToCreatePayload,
  validateQuotationDraft,
} from "@/lib/quotation";

describe("quotation mixed-line regression", () => {
  test("validateQuotationDraft accepts CUSTOM lines with productId = null", () => {
    const draft = createEmptyQuotationDraft();
    draft.customerName = "Priya Sharma";
    draft.customerPhone = "9876543210";
    draft.customerEmail = "priya@example.com";
    draft.customerAddress = "H.No. 1, Hyderabad";
    draft.validUntil = "2026-01-01";

    draft.items.push({
      id: "c1",
      productId: null,
      productName: "Custom teak dining table",
      imageUrl: null,
      imageStorageKey: null,
      quantity: 1,
      unitPrice: 45999,
    });

    expect(validateQuotationDraft(draft)).toBeNull();
  });

  test("validateQuotationDraft rejects CUSTOM line missing productName", () => {
    const draft = createEmptyQuotationDraft();
    draft.customerName = "Priya Sharma";
    draft.customerPhone = "9876543210";
    draft.customerEmail = "priya@example.com";
    draft.customerAddress = "H.No. 1, Hyderabad";
    draft.validUntil = "2026-01-01";

    draft.items.push({
      id: "c1",
      productId: null,
      productName: "   ",
      imageUrl: null,
      imageStorageKey: null,
      quantity: 1,
      unitPrice: 45999,
    });

    expect(validateQuotationDraft(draft)).toMatch(/Custom item name is required/i);
  });

  test("draftToCreatePayload serializes CATALOG vs CUSTOM discriminator", () => {
    const draft = createEmptyQuotationDraft();
    draft.customerName = "Priya Sharma";
    draft.customerPhone = "9876543210";
    draft.customerEmail = "priya@example.com";
    draft.customerAddress = "H.No. 1, Hyderabad";
    draft.validUntil = "2026-01-01";

    draft.items.push({
      id: "cat1",
      productId: 12,
      productName: "Teak dining chair",
      imageUrl: null,
      imageStorageKey: null,
      quantity: 2,
      unitPrice: 1999,
    });
    draft.items.push({
      id: "cus1",
      productId: null,
      productName: "Custom teak table",
      imageUrl: "https://cdn.example.com/orders/custom/line.webp",
      imageStorageKey: "orders/custom/2026/08/abc.webp",
      quantity: 1,
      unitPrice: 45999,
    });

    const payload = draftToCreatePayload(draft, {
      url: "https://cdn.example.com/quotes/qt.pdf",
      key: "quotes/qt/2026/08/qt.pdf",
    });

    expect(payload.products[0]).toMatchObject({
      type: "CATALOG",
      productId: 12,
      quantity: 2,
      price: 1999,
    });

    expect(payload.products[1]).toMatchObject({
      type: "CUSTOM",
      productName: "Custom teak table",
      quantity: 1,
      price: 45999,
      image: {
        url: "https://cdn.example.com/orders/custom/line.webp",
        storageKey: "orders/custom/2026/08/abc.webp",
      },
    });
  });
});

