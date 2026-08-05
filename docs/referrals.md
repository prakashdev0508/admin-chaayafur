# Referrals API

Customer referral codes and commission tracking (no friend discount). Credits land in the wallet on **order delivery**.

[← Back to index](./README.md) · [Wallet](./wallet.md) · [Orders](./orders.md)

---

## Overview

1. Customer gets a unique referral code (`GET /users/me/referral`)
2. Friend places an order with optional `referralCode` on `POST /orders` (tracking only — **no discount**)
3. A `Referral` row is created as `PENDING`
4. Friend pays via Razorpay → order `CONFIRMED` (still no commission)
5. Staff marks order `DELIVERED` → **5%** of `totalAmount` is credited to the referrer wallet with a **7-day** hold (`availableAt`)
6. If the order is cancelled before delivery, the referral becomes `CANCELLED`

Commission rate and hold days are configurable via env:

| Env | Default |
|-----|---------|
| `REFERRAL_COMMISSION_RATE` | `0.05` (5%) |
| `WALLET_CREDIT_HOLD_DAYS` | `7` |
| `EMAIL_STORE_URL` | used to build optional `shareUrl` |

### Who can access?

| Endpoint | Customer | Staff |
|----------|:--------:|:-----:|
| `GET /users/me/referral` | Yes | No |
| `GET /users/me/referrals` | Yes | No |
| `GET /admin/referrals` | No | `view-referrals` |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/users/me/referral` | Customer JWT | `200` |
| `GET` | `/api/v1/users/me/referrals` | Customer JWT | `200` |
| `GET` | `/api/v1/admin/referrals` | Staff (`view-referrals`) | `200` |

Checkout field: optional `referralCode` on `POST /api/v1/orders` (see [orders.md](./orders.md)).

---

## GET /api/v1/users/me/referral

Generates a unique code on first call (format `CHAYA` + 6 chars).

### Response

```json
{
  "code": "CHAYAAB12CD",
  "shareUrl": "https://chaayafurnitures.com?ref=CHAYAAB12CD"
}
```

`shareUrl` is `null` when `EMAIL_STORE_URL` is not set.

---

## GET /api/v1/users/me/referrals

Paginated list of referrals created by the current customer.

### Query

| Param | Default |
|-------|---------|
| `page` | `1` |
| `limit` | `10` |

### Response item

```json
{
  "id": 1,
  "status": "CREDITED",
  "orderTotalAmount": "10000.00",
  "commissionRate": "0.05",
  "commissionAmount": "500.00",
  "creditedAt": "2026-08-10T10:00:00.000Z",
  "createdAt": "2026-08-02T10:00:00.000Z",
  "order": {
    "id": 42,
    "orderNumber": "ORD-CF-20260802-0001",
    "status": "DELIVERED"
  },
  "referee": {
    "id": 7,
    "phone": "9876543210"
  }
}
```

### Referral statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Order placed with code; waiting for delivery |
| `CREDITED` | Order delivered; wallet CREDIT created |
| `CANCELLED` | Order cancelled before delivery |

---

## GET /api/v1/admin/referrals

Staff list with optional `status` filter (`PENDING` \| `CREDITED` \| `CANCELLED`) plus pagination. Each item includes `referrer` (`id`, `phone`, `referralCode`).

---

## Checkout rules

- `referralCode` is independent of `couponCode`
- Invalid / inactive / own code → `400` before order is created
- Self-referral is rejected
- One referral per order (`orderId` unique)

---

## Delivery credit

Triggered only on the **first** staff transition to `DELIVERED` (same gate as the delivered email). Idempotent via referral status + unique wallet transaction per referral.
