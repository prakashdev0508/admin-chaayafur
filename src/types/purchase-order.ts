export type PurchaseOrderVendor = {
  name: string;
  address: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
};

export type PurchaseOrderParty = {
  name: string;
  unitName: string;
  address: string;
  state: string;
  gstin: string;
  phone: string;
  email: string;
};

export type PurchaseOrderCompanyLegal = {
  pan: string;
  cin: string;
  /** Company address shown on the letterhead (prefilled from showroom). */
  address: string;
};

export type PurchaseOrderLine = {
  id: string;
  /** Original order item id when prefilled from an order. */
  orderItemId: number | null;
  description: string;
  hsn: string;
  workCompDate: string;
  uom: string;
  quantity: number;
  basicAmount: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
};

export type PurchaseOrderDraft = {
  poNumber: string;
  date: string;
  companyLegal: PurchaseOrderCompanyLegal;
  vendor: PurchaseOrderVendor;
  shipTo: PurchaseOrderParty;
  billTo: PurchaseOrderParty;
  items: PurchaseOrderLine[];
  /** Terms & conditions shown as bullets at the bottom of the PO. */
  terms: string[];
};

export type PurchaseOrderCompanyInfo = {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  showroomAddress: string | null;
  gstin: string | null;
};
