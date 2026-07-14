# Customers API

Customer OTP authentication and profile for the Chaaya Furnitures storefront.

[← Back to index](./README.md) · [Addresses](./addresses.md) · [Orders](./orders.md) · [Auth (staff)](./auth.md)

---

## Overview

- **Auth is mobile + OTP only** — no password for customers
- **Phone is the unique login identifier** — stored as 10-digit Indian mobile
- **Name, email, and contact details live on addresses** — not on the customer record
- Customer record stores only: `id`, `phone`, `lastLogin`, `isActive`, timestamps
- **Cart lives on the frontend** (`localStorage`) — no backend cart API

### Phone format

| Input | Stored as |
|-------|-----------|
| `9876543210` | `9876543210` |
| `+919876543210` | `9876543210` |
| `+91-9876543210` | `9876543210` |

### OTP flow

```
POST /auth/customer/send-otp   →  OTP SMS via 2factor.in (also logged in non-production)
POST /auth/customer/verify-otp →  JWT returned (auto-register if new)
```

| Setting | Env variable | Default |
|---------|--------------|---------|
| OTP length | `OTP_LENGTH` | `6` |
| OTP expiry | `OTP_TTL_MS` | `300000` (5 min) |
| Max verify attempts | `OTP_MAX_ATTEMPTS` | `5` |
| Resend cooldown | `OTP_RESEND_COOLDOWN_MS` | `60000` (1 min) |
| SMS provider API key | `2FA_API_KEY` | — (required in production) |
| SMS API base URL | `2FA_BASE_URL` | `https://2factor.in/API/V1` |
| SMS template (optional) | `2FA_OTP_TEMPLATE` | — (DLT template name if required) |

OTP SMS is sent via [2factor.in](https://2factor.in/) when `2FA_API_KEY` is set. The app generates the code, stores it for verification, and delivers it with:

`GET {2FA_BASE_URL}/{2FA_API_KEY}/SMS/91{phone}/{otp}[/{template}]`

In non-production, the OTP is also printed to the server console. Without `2FA_API_KEY`, development still logs the OTP; production returns `503`.

### JWT payload (customer)

| Field | Type | Description |
|-------|------|-------------|
| `sub` | integer | Customer ID |
| `phone` | string | Customer mobile (10 digits) |
| `type` | string | Always `customer` |

---

## Endpoints

| Method | Endpoint | Auth | Access |
|--------|----------|------|--------|
| `POST` | `/api/v1/auth/customer/send-otp` | Public | Anyone |
| `POST` | `/api/v1/auth/customer/verify-otp` | Public | Anyone |
| `GET` | `/api/v1/users/me` | Bearer (customer) | Customer only |
| `GET` | `/api/v1/users/me/orders` | Bearer (customer) | Own orders |
| `GET` | `/api/v1/users/me/orders/:orderId` | Bearer (customer) | Own order |
| `GET` | `/api/v1/users/me/orders/:orderId/tracking` | Bearer (customer) | Own order |
| `GET` | `/api/v1/users/me/tickets` | Bearer (customer) | Own tickets |
| `GET` | `/api/v1/users/me/tickets/:ticketId` | Bearer (customer) | Own ticket |
| `GET` | `/api/v1/users/me/addresses` | Bearer (customer) | Own addresses |
| `GET` | `/api/v1/users/me/reviews` | Bearer (customer) | Own reviews |

These `/users/me/*` routes are **customer-only** (separate from staff `/customers` and dual-mode `/orders`). Every lookup is scoped to the JWT customer id — never trust a client-supplied customer id.

---

## POST /api/v1/auth/customer/send-otp

Send a one-time password to the customer's mobile number.

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |

### Request body

```json
{
  "phone": "9876543210"
}
```

### Success response

```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresInSeconds": 300
  }
}
```

If resent too soon:

```json
{
  "success": true,
  "data": {
    "message": "OTP already sent. Please wait before requesting again.",
    "retryAfterSeconds": 45
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/auth/customer/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

---

## POST /api/v1/auth/customer/verify-otp

Verify OTP and login. Creates a new customer account automatically if the phone is not registered.

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |

### Request body

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Success response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "9876543210",
      "lastLogin": "2026-07-10T12:00:00.000Z",
      "isActive": true,
      "createdAt": "2026-07-10T10:00:00.000Z"
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Invalid phone or OTP format |
| `401` | Invalid OTP, expired OTP, or too many attempts |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/auth/customer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

---

## GET /api/v1/users/me

Get the authenticated customer's profile.

| | |
|---|---|
| **Auth** | Bearer (customer JWT) |
| **Status** | `200` |

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "9876543210",
    "isActive": true,
    "lastLogin": "2026-07-10T12:00:00.000Z",
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T12:00:00.000Z",
    "defaultAddress": {
      "id": 2,
      "type": "SHIPPING",
      "name": "Priya Sharma",
      "email": "priya@example.com",
      "phone": "9876543210",
      "city": "Mumbai",
      "state": "MH",
      "isDefault": true
    },
    "counts": {
      "addresses": 2,
      "orders": 5,
      "openTickets": 1,
      "productReviews": 2,
      "orderReviews": 1,
      "reviews": 3
    },
    "addressCount": 2
  }
}
```

> Use [addresses.md](./addresses.md) to manage name, email, and delivery contact per address (max 5).

---

## GET /api/v1/users/me/orders

List the authenticated customer's own orders (same payload shape as customer `GET /orders`). Optional query: `status`, `page`, `limit`.

## GET /api/v1/users/me/orders/:orderId

Order detail for an owned order. Returns `404` if the order is missing or belongs to someone else.

## GET /api/v1/users/me/orders/:orderId/tracking

Tracking timeline for an owned order.

## GET /api/v1/users/me/tickets

Cross-order list of the customer's support tickets. Optional query: `status`, `type`, `orderId`, `q`, `page`, `limit`. `customerId` from the client is ignored.

## GET /api/v1/users/me/tickets/:ticketId

Ticket detail + messages for an owned ticket (`404` if not owned).

## GET /api/v1/users/me/addresses

Same as `GET /addresses` — list of the customer's addresses.

## GET /api/v1/users/me/reviews

Own product and order reviews. See [reviews.md](./reviews.md).

---

## Typical storefront flow

1. `POST /auth/customer/send-otp` → user receives OTP
2. `POST /auth/customer/verify-otp` → store `accessToken`, `lastLogin` updated
3. `POST /addresses` → save shipping/billing with name, email, phone (max 5)
4. Checkout via `POST /orders` — see [orders.md](./orders.md)
5. After delivery, submit reviews via [reviews.md](./reviews.md)
