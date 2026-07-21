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

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /customers` | `update-customers` | Yes | Yes | No |
| `GET /customers` | `view-customers` | Yes | Yes | Yes |
| `GET /customers/:id` | `view-customers` | Yes | Yes | Yes |
| `GET /customers/:id/orders` | `view-customers` + `view-orders` | Yes | Yes | Yes |
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
| `GET` | `/api/v1/customers/:id` | `200` |
| `GET` | `/api/v1/customers/:id/orders` | `200` |
| `GET` | `/api/v1/customers/:id/audit-logs` | `200` |
| `PATCH` | `/api/v1/customers/:id` | `200` |
| `POST` | `/api/v1/customers/:id/addresses` | `201` |
| `PATCH` | `/api/v1/customers/:id/addresses/:addressId` | `200` |
| `DELETE` | `/api/v1/customers/:id/addresses/:addressId` | `200` |
| `POST` | `/api/v1/customers/:id/block` | `200` |
| `POST` | `/api/v1/customers/:id/unblock` | `200` |

---

## GET /api/v1/customers/:id

Customer detail including addresses, **current cart** (if any), and **recent orders** (last 10).

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

Staff can create, update, and delete customer addresses using the same field validation as the storefront `POST /addresses` API.

### POST /api/v1/customers/:id/addresses

Create address for a customer. Max 5 addresses per customer.

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

## Blocked customer behavior

When `isActive` is `false`:

- `POST /auth/customer/verify-otp` returns `401 Customer account is inactive`
- Existing JWTs fail on next request (customer marked inactive in JWT strategy)
