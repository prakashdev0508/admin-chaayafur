export type InvoiceLineItem = {
  productId: number;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type Invoice = {
  id: number;
  orderId: number;
  invoiceNumber: string;
  issuedAt: string;
  billingName: string;
  billingAddress: string;
  subtotal: string;
  discountAmount?: string;
  shippingAmount?: string;
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

/** POST /orders/:id/invoice/email */
export type InvoiceEmailResult = {
  sent: boolean;
  orderId: number;
  orderNumber: string;
  invoiceNumber: string;
  to: string;
  pdfUrl?: string | null;
};
