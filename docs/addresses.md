# Addresses API

Manage customer shipping and billing addresses with contact details.

[← Back to index](./README.md) · [Customers](./customers.md) · [Orders](./orders.md)

---

## Overview

- **Customer only** — all routes require a customer JWT
- **Max 5 addresses per customer** — enforced on create
- **Contact details on address** — `name`, `email`, and `phone` belong to each address, not the customer account
- Two address types: `SHIPPING` and `BILLING`
- Used at checkout via `shippingAddressId` and optional `billingAddressId`
- Address snapshots (including name/email/phone) are stored on the order at checkout

### Who can access?

| Endpoint | Customer | Staff |
|----------|:--------:|:-----:|
| `GET /addresses` | Yes | No |
| `POST /addresses` | Yes | No |
| `PATCH /addresses/:id` | Yes (own) | No |
| `DELETE /addresses/:id` | Yes (own) | No |

---

## Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| `GET` | `/api/v1/addresses` | `200` |
| `POST` | `/api/v1/addresses` | `201` |
| `PATCH` | `/api/v1/addresses/:id` | `200` |
| `DELETE` | `/api/v1/addresses/:id` | `204` |

All endpoints require:

```http
Authorization: Bearer <customerAccessToken>
```

---

## POST /api/v1/addresses

Create a new address. Fails with `400` if customer already has 5 addresses.

| | |
|---|---|
| **Auth** | Bearer (customer JWT) |
| **Status** | `201` |

### Request body

```json
{
  "type": "SHIPPING",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "line1": "123 Main Street",
  "line2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zipCode": "400001",
  "country": "IN",
  "isDefault": true
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `type` | string | Yes | `SHIPPING` or `BILLING` |
| `name` | string | Yes | Recipient name |
| `email` | string | No | Valid email |
| `phone` | string | No | Valid Indian mobile |
| `line1` | string | Yes | Max 200 characters |
| `line2` | string | No | Max 200 characters |
| `city` | string | Yes | Max 100 characters |
| `state` | string | Yes | Max 100 characters |
| `zipCode` | string | Yes | Max 20 characters |
| `country` | string | No | Default `IN` |
| `isDefault` | boolean | No | Default `false` |

### Errors

| Status | When |
|--------|------|
| `400` | Validation failed or max 5 addresses reached |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SHIPPING",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "isDefault": true
  }'
```

---

## GET /api/v1/addresses

List all addresses for the authenticated customer.

### Success response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "type": "SHIPPING",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "line1": "123 Main Street",
      "line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "IN",
      "isDefault": true,
      "createdAt": "2026-07-10T10:00:00.000Z",
      "updatedAt": "2026-07-10T10:00:00.000Z"
    }
  ]
}
```

---

## PATCH /api/v1/addresses/:id

Update an existing address. All fields optional (same as create).

### Errors

| Status | When |
|--------|------|
| `404` | Address not found or not owned by customer |

---

## DELETE /api/v1/addresses/:id

Delete an address.

| | |
|---|---|
| **Status** | `204` |

### Errors

| Status | When |
|--------|------|
| `404` | Address not found or not owned by customer |
