export type SupportTicketType = "QUESTION" | "PROBLEM";

export type SupportTicketStatus =
  | "OPEN"
  | "AWAITING_STAFF"
  | "AWAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketAuthorType = "CUSTOMER" | "STAFF";

export type SupportTicketAttachment = {
  id?: number;
  url: string;
  storageKey: string;
  sortOrder?: number;
};

export type SupportTicketMessage = {
  id: number;
  authorType: SupportTicketAuthorType;
  authorId: number;
  body: string;
  createdAt: string;
  attachments: SupportTicketAttachment[];
};

export type SupportTicketOrderRef = {
  id: number;
  orderNumber: string;
  status: string;
};

export type SupportTicketCustomerRef = {
  id: number;
  phone: string;
};

export type SupportTicketListItem = {
  id: number;
  ticketNumber: string;
  orderId: number;
  customerId: number;
  type: SupportTicketType;
  subject: string;
  status: SupportTicketStatus;
  order: SupportTicketOrderRef;
  customer?: SupportTicketCustomerRef;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicket = SupportTicketListItem & {
  messages: SupportTicketMessage[];
};

export type CreateSupportTicketPayload = {
  type: SupportTicketType;
  subject: string;
  message: string;
  attachments?: SupportTicketAttachment[];
};

export type CreateSupportTicketMessagePayload = {
  message: string;
  attachments?: SupportTicketAttachment[];
  awaitingCustomer?: boolean;
};

export type UpdateSupportTicketPayload = {
  status: "RESOLVED" | "CLOSED";
  resolutionNote?: string;
};

export type ListSupportTicketsParams = {
  status?: SupportTicketStatus;
  type?: SupportTicketType;
  orderId?: number;
  customerId?: number;
  q?: string;
  page?: number;
  limit?: number;
};
