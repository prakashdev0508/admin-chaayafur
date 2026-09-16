# Admin — Customers API

Staff endpoints to list, view, edit, and manage customer addresses with field-level audit logging. There is **no delete** for customers — use block instead.

[← Back to index](./README.md) · [Storefront customers](./customers.md) · [Cart (staff)](./cart.md) · [Admin audit logs](./admin-audit-logs.md) · [Auth](./auth.md)

---

## Overview

- Customers are identified by **phone** on the account record — **phone is immutable** (not editable by staff)
- **ADMIN** and **SUPER_ADMIN** can edit `isActive` and manage customer addresses
- **ORDER_MANAGER** can view customers only (no edits)
- Every customer/address update writes **audit log** entries (who changed which field)
- **Block** sets `isActive: false` — blocked customers cannot verify OTP / login
- No hard delete — order history is preserved
- **Lead follow-ups** — staff can add multiple remarks with a `nextFollowUpDate`, list a customer's full history (including completed), and fetch incomplete follow-ups scheduled for a calendar day

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /customers` | `update-customers` | Yes | Yes | No |
| `GET /customers` | `view-customers` | Yes | Yes | Yes |
| `GET /customers/follow-ups` | `view-customers` | Yes | Yes | Yes |
| `GET /customers/:id` | `view-customers` | Yes | Yes | Yes |
| `GET /customers/:id/orders` | `view-customers` + `view-orders` | Yes | Yes | Yes |
| `GET /customers/:id/follow-ups` | `view-customers` | Yes | Yes | Yes |
| `POST /customers/:id/follow-ups` | `update-customers` | Yes | Yes | No |
| `PATCH /customers/:id/follow-ups/:followUpId` | `update-customers` | Yes | Yes | No |
| `GET /customers/:id/audit-logs` | `view-customers` | Yes | Yes | Yes |
| `PATCH /customers/:id` | `update-customers` | Yes | Yes | No |
| `POST /customers/:id/addresses` | `update-customers` | Yes | Yes | No |
| `PATCH /customers/:id/addresses/:addressId` | `update-customers` | Yes | Yes | No |
| `DELETE /customers/:id/addresses/:addressId` | `update-customers` | Yes | Yes | No |
| `POST /customers/:id/block` | `update-customers` | Yes | Yes | No |
| `POST /customers/:id/unblock` | `update-customers` | Yes | Yes | No |

All endpoints require staff JWT:

```http
Authorization: Bearer <staffAccessToken>
```

---

## Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| `POST` | `/api/v1/customers` | `201` |
| `GET` | `/api/v1/customers` | `200` |
| `GET` | `/api/v1/customers/follow-ups` | `200` |
| `GET` | `/api/v1/customers/:id` | `200` |
| `GET` | `/api/v1/customers/:id/orders` | `200` |
| `GET` | `/api/v1/customers/:id/follow-ups` | `200` |
| `POST` | `/api/v1/customers/:id/follow-ups` | `201` |
| `PATCH` | `/api/v1/customers/:id/follow-ups/:followUpId` | `200` |
| `GET` | `/api/v1/customers/:id/audit-logs` | `200` |
| `PATCH` | `/api/v1/customers/:id` | `200` |
| `POST` | `/api/v1/customers/:id/addresses` | `201` |
| `PATCH` | `/api/v1/customers/:id/addresses/:addressId` | `200` |
| `DELETE` | `/api/v1/customers/:id/addresses/:addressId` | `200` |
| `POST` | `/api/v1/customers/:id/block` | `200` |
| `POST` | `/api/v1/customers/:id/unblock` | `200` |

---

## GET /api/v1/customers

Paginated customer list. Each item includes `addressCount`, `orderCount`, and `followUpCount` (total follow-ups, completed + incomplete).

---

## GET /api/v1/customers/:id

Customer detail including addresses, **follow-ups**, **current cart** (if any), and **recent orders** (last 10).

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "9876543210",
    "isActive": true,
    "lastLogin": "2026-07-10T11:00:00.000Z",
    "orderCount": 2,
    "reviewCount": 0,
    "addresses": [],
    "followUps": [
      {
        "id": 1,
        "remark": "Called customer; interested in dining set",
        "nextFollowUpDate": "2026-09-20T00:00:00.000Z",
        "isFollowedUp": false,
        "createdByStaffId": 2,
        "createdAt": "2026-09-15T10:00:00.000Z"
      }
    ],
    "cart": {
      "id": 3,
      "customerId": 1,
      "customer": { "id": 1, "phone": "9876543210" },
      "items": [
        {
          "productId": 1,
          "quantity": 2,
          "unitPrice": "24999.99",
          "lineTotal": "49999.98",
          "name": "Oak Dining Table",
          "slug": "oak-dining-table",
          "stock": 5,
          "imageUrl": "https://cdn.example.com/products/1.jpg",
          "isAvailable": true
        }
      ],
      "itemCount": 2,
      "subtotalAmount": "49999.98",
      "createdAt": "2026-07-20T10:00:00.000Z",
      "updatedAt": "2026-07-21T12:00:00.000Z"
    },
    "recentOrders": [
      {
        "id": 10,
        "orderNumber": "ORD-20260710-0001",
        "status": "CONFIRMED",
        "totalAmount": "49999.98",
        "createdAt": "2026-07-10T12:00:00.000Z"
      }
    ]
  }
}
```

`cart` is `null` when the customer has never created a server cart. Prices are computed live from products (same shape as [cart.md](./cart.md) staff detail).

---

## PATCH /api/v1/customers/:id

Update customer fields. **Phone cannot be changed.**

### Request body

```json
{
  "isActive": false
}
```

At least one field is required. Changes are recorded in the audit log with staff user attribution.

---

## Admin address management

Staff can create, update, and delete customer addresses using the same field validation as the storefront `POST /addresses` API (including optional `gstin`).

### POST /api/v1/customers/:id/addresses

Create address for a customer. Max 50 addresses per customer.

### PATCH /api/v1/customers/:id/addresses/:addressId

Update address fields. All address field changes are audit-logged.

### DELETE /api/v1/customers/:id/addresses/:addressId

Delete an address. Returns `400` if the address is linked to a non-cancelled order.

---

## GET /api/v1/customers/:id/orders

Paginated order list for the customer detail page.

Query params: `page`, `limit`, `status`.

Requires `view-customers` and `view-orders`.

---

## GET /api/v1/customers/:id/audit-logs

Paginated audit history for the customer account and their addresses.

See [admin-audit-logs.md](./admin-audit-logs.md).

---

## Customer follow-ups (lead CRM)

Staff can attach multiple follow-up remarks with a scheduled next date. Each `POST` appends a new history row. The day-agenda API (`GET /customers/follow-ups`) hides completed follow-ups (`isFollowedUp: true`); customer detail and per-customer history include **all** follow-ups.

### POST /api/v1/customers/:id/follow-ups

| | |
|---|---|
| **Permission** | `update-customers` |
| **Status** | `201` |

```json
{
  "remark": "Called customer; interested in dining set",
  "nextFollowUpDate": "2026-09-20"
}
```

New follow-ups start with `isFollowedUp: false`.

### PATCH /api/v1/customers/:id/follow-ups/:followUpId

Mark a follow-up completed (or reopen it).

| | |
|---|---|
| **Permission** | `update-customers` |
| **Status** | `200` |

```json
{
  "isFollowedUp": true
}
```

### GET /api/v1/customers/:id/follow-ups

| | |
|---|---|
| **Permission** | `view-customers` |
| **Status** | `200` |

Returns `{ "items": [ ... ] }` newest first — **all** follow-ups (completed and incomplete). Each item includes `customer: { id, phone }` and `isFollowedUp`.

### GET /api/v1/customers/follow-ups

Day agenda of incomplete follow-ups whose `nextFollowUpDate` falls on the given calendar day (UTC). Completed ones (`isFollowedUp: true`) are excluded.

| Query | Default | Description |
|-------|---------|-------------|
| `date` | today (UTC `YYYY-MM-DD`) | Calendar day to list |

```json
{
  "date": "2026-09-20",
  "items": [
    {
      "id": 1,
      "customerId": 1,
      "remark": "Called customer; interested in dining set",
      "nextFollowUpDate": "2026-09-20T00:00:00.000Z",
      "isFollowedUp": false,
      "createdByStaffId": 2,
      "createdAt": "2026-09-15T10:00:00.000Z",
      "customer": { "id": 1, "phone": "9876543210" }
    }
  ]
}
```

---

## Blocked customer behavior

When `isActive` is `false`:

- `POST /auth/customer/verify-otp` returns `401 Customer account is inactive`
- Existing JWTs fail on next request (customer marked inactive in JWT strategy)
