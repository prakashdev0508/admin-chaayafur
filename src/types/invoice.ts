export type InvoiceType = "PERFORMA" | "TAX";

/** Body value for POST /orders/:id/invoice/generate */
export type InvoiceGenerateType = "pf" | "txi";

export type InvoiceLineItem = {
  productId: number;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  hsnCode?: string | null;
  woodName?: string | null;
  woodColor?: string | null;
  woodPriceAdjustment?: string | null;
  polishName?: string | null;
  polishColor?: string | null;
  polishPriceAdjustment?: string | null;
  fabricName?: string | null;
  fabricColor?: string | null;
  fabricPriceAdjustment?: string | null;
};

export type Invoice = {
  id: number;
  orderId: number;
  invoiceType: InvoiceType;
  invoiceNumber: string;
  issuedAt: string;
  billingName: string;
  billingAddress: string;
  subtotal: string;
  discountAmount?: string;
  shippingAmount?: string;
  deliveryFloor?: number;
  liftAccessAvailable?: boolean;
  floorDeliveryAmount?: string;
  taxAmount: string;
  totalAmount: string;
  pdfUrl?: string | null;
  pdfStorageKey?: string | null;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
  order: {
    orderNumber: string;
    customer: {
      id: number;
      email?: string;
      firstName?: string;
      lastName?: string;
      phone: string;
    };
  };
};

/** GET /orders/:id/invoice — both types; either may be null */
export type OrderInvoices = {
  performa: Invoice | null;
  tax: Invoice | null;
};

export type GenerateInvoicePayload = {
  invoiceType: InvoiceGenerateType;
};

/** POST /orders/:id/invoice/email */
export type InvoiceEmailResult = {
  sent: boolean;
  orderId: number;
  orderNumber: string;
  invoiceNumber: string;
  to: string;
  pdfUrl?: string | null;
};
