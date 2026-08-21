export type QuotationLineItem = {
  id: string;
  /** Catalog product id when available; null represents an off-catalog custom line. */
  productId: number | null;
  productName: string;
  imageUrl: string | null;
  /** R2 storage key for the uploaded line image (required for backend snapshotting). */
  imageStorageKey?: string | null;
  quantity: number;
  unitPrice: number;
};

export type QuotationDraft = {
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  validUntil: string;
  notes: string;
  items: QuotationLineItem[];
};

export type QuotationCompanyInfo = {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  showroomAddress: string | null;
  gstin: string | null;
};

export const QUOTATION_STATUSES = [
  "SENT",
  "FOLLOW_UP",
  "CLOSED",
  "CONVERTED",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export type QuotationProduct = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  price: string;
  lineTotal: string;
  productImageUrl?: string | null;
  productImageKey?: string | null;
};

export type QuotationRemark = {
  id: number;
  remark: string;
  createdAt: string;
};

export type Quotation = {
  id: number;
  quotationNumber: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  validUntil: string;
  address: string;
  notes: string | null;
  status: QuotationStatus;
  pdfUrl: string;
  pdfStorageKey: string | null;
  totalPrice: string;
  gstAmount: string;
  products: QuotationProduct[];
  followUpRemarks: QuotationRemark[];
  createdAt: string;
  updatedAt: string;
};

export type QuotationListItem = Omit<
  Quotation,
  "products" | "followUpRemarks"
> & {
  products?: QuotationProduct[];
  followUpRemarks?: QuotationRemark[];
};

export type CreateQuotationPayload = {
  customerName: string;
  mobileNumber: string;
  email: string;
  validUntil: string;
  address: string;
  notes?: string;
  pdfUrl: string;
  pdfStorageKey?: string;
  products: Array<
    | {
        type: "CATALOG";
        productId: number;
        quantity: number;
        price: number;
        image?: { url: string; storageKey: string } | null;
      }
    | {
        type: "CUSTOM";
        productName: string;
        quantity: number;
        price: number;
        image?: { url: string; storageKey: string } | null;
      }
  >;
  totalPrice: number;
  gstAmount: number;
};

export type UpdateQuotationPayload = Partial<CreateQuotationPayload> & {
  status?: QuotationStatus;
};

export type ListQuotationsParams = {
  page?: number;
  limit?: number;
  status?: QuotationStatus;
  search?: string;
};

export type SendQuotationEmailResult = {
  sent: boolean;
  quotationId: number;
  quotationNumber: string;
  to: string;
  pdfUrl: string;
};

export type QuotationPdfUploadResult = {
  url: string;
  key: string;
};
