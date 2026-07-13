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
  taxAmount: string;
  totalAmount: string;
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
