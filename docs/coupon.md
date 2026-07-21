# Coupons API

Admin coupon management, public promo listing, validation at checkout, and order discount integration.

[← Back to index](./README.md) · [Orders](./orders.md) · [Invoices](./invoices.md)

---

## Overview

- Admins create coupons with a **type** (flat or percentage) and **visibility** (public or private)
- **Public** coupons appear on `GET /coupons/public` for the website
- **Private** coupons are admin-only in listings; customers can still apply them if they know the code
- Customers can **preview** a coupon via `POST /coupons/validate` before checkout
- Coupons are applied at checkout via optional `couponCode` on `POST /orders`
- One coupon per order; discounts are computed server-side from live product prices
- Coupon usage is counted at order creation and **restored** if payment fails or staff cancels (global `usedCount` only)
- **Per-customer limit** (`perPersonAllowed`) uses `coupon_redemption_history`, which is written at order creation and **never removed** — cancelled/refunded orders still count toward the customer's limit

### Coupon types

| Type | Description |
|------|-------------|
| `FLAT_CART` | Fixed ₹ discount on cart subtotal (capped at subtotal) |
| `PERCENTAGE_CART` | Percentage discount on cart subtotal (1–100%, rounded to 2 decimals) |

Both types require the cart subtotal to meet `minCartAmount`.

### Visibility

| Visibility | Admin list | Public website | Checkout |
|------------|:----------:|:--------------:|:--------:|
| `PUBLIC` | Yes | Yes (`GET /coupons/public`) | Yes |
| `PRIVATE` | Yes | No | Yes (if code entered) |

### Who can access?

| Endpoint | Customer | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|:--------:|:-----------:|:-----:|:-------------:|
| `POST /coupons` | No | Yes | Yes | No |
| `PATCH /coupons/:id` | No | Yes | Yes | No |
| `GET /coupons` | No | Yes | Yes | Yes (view only) |
| `GET /coupons/:id` | No | Yes | Yes | Yes |
| `GET /coupons/public` | Public | Public | Public | Public |
| `POST /coupons/validate` | Yes | No | No | No |

Permissions: `create-coupons`, `update-coupons`, `view-coupons`.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/coupons` | Staff (`create-coupons`) | `201` |
| `PATCH` | `/api/v1/coupons/:id` | Staff (`update-coupons`) | `200` |
| `GET` | `/api/v1/coupons` | Staff (`view-coupons`) | `200` |
| `GET` | `/api/v1/coupons/:id` | Staff (`view-coupons`) | `200` |
| `GET` | `/api/v1/coupons/public` | Public | `200` |
| `POST` | `/api/v1/coupons/validate` | Customer JWT | `200` |

---

## POST /api/v1/coupons

Create a coupon.

### Request body — flat discount example

```json
{
  "code": "SAVE500",
  "type": "FLAT_CART",
  "visibility": "PUBLIC",
  "discountValue": 500,
  "minCartAmount": 2000,
  "maxUses": 100,
  "startsAt": "2026-07-01T00:00:00.000Z",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "isActive": true,
  "description": "Flat ₹500 off on orders above ₹2000"
}
```

### Request body — percentage discount example

```json
{
  "code": "SUMMER10",
  "type": "PERCENTAGE_CART",
  "visibility": "PRIVATE",
  "discountValue": 10,
  "minCartAmount": 1500,
  "startsAt": "2026-07-01T00:00:00.000Z",
  "expiresAt": "2026-08-31T23:59:59.000Z",
  "description": "10% off for email subscribers"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `code` | string | Yes | Max 32 chars; stored uppercase; unique |
| `type` | enum | Yes | `FLAT_CART` or `PERCENTAGE_CART` |
| `visibility` | enum | Yes | `PUBLIC` or `PRIVATE` |
| `discountValue` | number | Yes | Flat: `> 0`; Percentage: `1–100` |
| `minCartAmount` | number | Yes | `>= 0` |
| `maxUses` | integer | No | Min 1; omit for unlimited |
| `perPersonAllowed` | integer | No | Min 1; max uses **per customer** (all-time; not freed when order is cancelled or refunded). Omit for unlimited |
| `startsAt` | ISO date | Yes | Must be before `expiresAt` |
| `expiresAt` | ISO date | Yes | Must be after `startsAt` |
| `isActive` | boolean | No | Default `true` |
| `description` | string | No | Optional promo text |

`code` cannot be changed after creation.

---

## GET /api/v1/coupons/:id

Coupon detail for staff, including **all-time** redemption history (from `coupon_redemption_history` — cancelled/refunded orders still appear).

| | |
|---|---|
| **Auth** | Staff (`view-coupons`) |
| **Status** | `200` |

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Redemptions page |
| `limit` | integer | `20` | Redemptions per page (max 100) |

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "SAVE500",
    "type": "FLAT_CART",
    "visibility": "PUBLIC",
    "discountValue": "500.00",
    "minCartAmount": "2000.00",
    "maxUses": 100,
    "perPersonAllowed": 1,
    "usedCount": 3,
    "startsAt": "2026-07-01T00:00:00.000Z",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "isActive": true,
    "description": "Flat ₹500 off on orders above ₹2000",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-10T12:00:00.000Z",
    "redemptions": {
      "items": [
        {
          "id": 10,
          "orderId": 21,
          "customerId": 5,
          "discountAmount": "500.00",
          "createdAt": "2026-07-10T12:00:00.000Z",
          "customer": { "id": 5, "phone": "9876543210" },
          "order": {
            "id": 21,
            "orderNumber": "ORD-20260710-0021",
            "status": "CONFIRMED",
            "totalAmount": "4500.00",
            "createdAt": "2026-07-10T12:00:00.000Z"
          }
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
}
```

```bash
curl "http://localhost:5000/api/v1/coupons/1?page=1&limit=20" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/coupons/public

List active public coupons for the website. No authentication required.

Returns only coupons that are:

- `visibility: PUBLIC`
- `isActive: true`
- Within `startsAt` / `expiresAt`
- Not exhausted (`usedCount < maxUses`, or unlimited)

### Success response

```json
{
  "success": true,
  "data": [
    {
      "code": "SAVE500",
      "type": "FLAT_CART",
      "discountValue": "500.00",
      "minCartAmount": "2000.00",
      "description": "Flat ₹500 off on orders above ₹2000",
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
  ]
}
```

---

## POST /api/v1/coupons/validate

Preview coupon discount before checkout. Requires customer JWT.

### Request body

```json
{
  "code": "SAVE500",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

### Success response

```json
{
  "success": true,
  "data": {
    "couponId": 1,
    "code": "SAVE500",
    "type": "FLAT_CART",
    "subtotal": "5000.00",
    "discountAmount": "500.00",
    "totalAmount": "4500.00",
    "minCartAmount": "2000.00"
  }
}
```

---

## Checkout integration

Pass optional `couponCode` when creating an order. See [orders.md](./orders.md).

```json
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "shippingAddressId": 1,
  "couponCode": "SAVE500"
}
```

Order response includes:

```json
{
  "subtotalAmount": "5000.00",
  "discountAmount": "500.00",
  "totalAmount": "4500.00",
  "coupon": {
    "id": 1,
    "code": "SAVE500",
    "type": "FLAT_CART"
  }
}
```

Razorpay payment amount uses the discounted `totalAmount`.

---

## Error cases

| Scenario | Status | Message |
|----------|--------|---------|
| Coupon not found | `404` | Coupon not found |
| Inactive coupon | `400` | Coupon is not active |
| Not yet started | `400` | Coupon is not yet valid |
| Expired | `400` | Coupon has expired |
| Usage limit reached | `400` | Coupon usage limit has been reached |
| Per-person limit reached | `400` | Your Limit exceed |
| Below minimum cart | `400` | Minimum cart amount of ₹X required for this coupon |
| Duplicate code | `409` | Coupon code already exists |

---

## Usage counting

- Global `usedCount` increments when an order is created with a coupon
- Restored when:
  - Razorpay payment fails or expires (webhook compensation)
  - Staff cancels the order (`PATCH /orders/:id` with `CANCELLED`)
- `perPersonAllowed` is enforced using **all-time** history per `(couponId, customerId)`; restoring `usedCount` on cancel does **not** remove history rows

---

## Invoice breakdown

Invoices include `subtotal`, `discountAmount`, `taxAmount`, and `totalAmount`. See [invoices.md](./invoices.md).
