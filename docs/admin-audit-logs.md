# Admin Audit Logs API

Field-level audit trail for staff changes to customers, addresses, and orders.

[← Back to index](./README.md) · [Admin customers](./admin-customers.md) · [Orders](./orders.md)

---

## Overview

Every staff update to customer, address, or order data writes one audit row **per changed field**:

| Field | Value |
|-------|-------|
| `entityType` | `CUSTOMER`, `ADDRESS`, `ORDER`, `ORDER_ITEM`, `PAYMENT`, `CART_ITEM` |
| `entityId` | ID of the changed record (`productId` for `CART_ITEM` / `ORDER_ITEM`) |
| `parentEntityId` | Customer ID (addresses, cart items) or order ID (line items / payment notes) |
| `fieldName` | Name of the field that changed |
| `oldValue` | Previous value (JSON-stringified when needed) |
| `newValue` | New value |
| `changedBy` | Staff user who made the change |
| `createdAt` | Timestamp |

---

## Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/v1/audit-logs` | `view-orders` | Global filtered list |
| `GET` | `/api/v1/customers/:id/audit-logs` | `view-customers` | Customer + address + cart item history |
| `GET` | `/api/v1/orders/:id/audit-logs` | `view-orders` | Order, items, payment history |

---

## GET /api/v1/audit-logs

### Query parameters

| Param | Type | Description |
|-------|------|-------------|
| `entityType` | string | `CUSTOMER`, `ADDRESS`, `ORDER`, `ORDER_ITEM`, `PAYMENT`, `CART_ITEM` |
| `entityId` | integer | Filter by entity ID |
| `parentEntityId` | integer | Filter by parent (e.g. customer ID) |
| `changedById` | integer | Filter by staff user |
| `page` | integer | Default `1` |
| `limit` | integer | Default `20`, max `100` |

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "entityType": "ORDER",
        "entityId": 42,
        "parentEntityId": null,
        "fieldName": "status",
        "oldValue": "PENDING",
        "newValue": "CONFIRMED",
        "changedBy": {
          "id": 1,
          "email": "admin@chaaya.com",
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2026-07-11T12:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## What gets logged

| Action | Entity types logged |
|--------|---------------------|
| Customer `isActive` change | `CUSTOMER` |
| Address create / update / delete | `ADDRESS` (all fields) |
| Order status, addresses, totals | `ORDER` |
| Line item quantity changes | `ORDER_ITEM` (`quantity` per product) |
| Payment notes update | `PAYMENT` |
| Staff cart add / set quantity / remove | `CART_ITEM` (`quantity`; `parentEntityId` = customer id) |

Customer login **phone** is not editable and therefore never appears in audit logs as a changed field.
