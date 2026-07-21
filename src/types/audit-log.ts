export type AuditEntityType =
  | "CUSTOMER"
  | "ADDRESS"
  | "ORDER"
  | "ORDER_ITEM"
  | "PAYMENT"
  | "CART_ITEM";

export type AuditLogStaff = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AuditLog = {
  id: number;
  entityType: AuditEntityType;
  entityId: number;
  parentEntityId: number | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: AuditLogStaff;
  createdAt: string;
};

export type ListAuditLogsParams = {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType;
  entityId?: number;
  parentEntityId?: number;
  changedById?: number;
};
