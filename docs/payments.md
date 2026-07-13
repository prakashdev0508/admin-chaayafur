# Payments API

Razorpay Payment Links integration. Payments are created at checkout and updated automatically via webhooks.

[← Back to index](./README.md) · [Orders](./orders.md) · [Invoices](./invoices.md)

---

## Overview

- Payments are **created automatically** when an order is placed — there is no customer `POST /payments`
- Checkout returns a **`paymentLinkUrl`** — redirect the customer to complete payment on Razorpay
- Payment status is updated by **Razorpay webhooks** (`payment_link.paid`, failure/expiry events)
- On successful payment: order → `CONFIRMED`, invoice generated
- On failed/expired payment: order → `CANCELLED`, stock restored
- Staff can **poll** payment status via `GET /payments/:id` — no manual status updates
- Staff can **list** all payments via `GET /payments`; customers see only their own order payments

### Payment statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting Razorpay payment (default for new orders) |
| `COMPLETED` | Payment received via Razorpay |
| `FAILED` | Payment failed, link expired, or checkout could not create a link |
| `REFUNDED` | Payment refunded (future phase) |

### Payment method

All payments use `RAZORPAY` (Payment Links).

### Who can access?

| Endpoint | Customer | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|:--------:|:-----------:|:-----:|:-------------:|
| `GET /payments` | Own payments | All | All | All |
| `GET /payments/:id` | Own order | All | All | All |
| `POST /payments/webhooks/razorpay` | Public (Razorpay) | — | — | — |

---

## Razorpay setup

### Environment variables

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_PAYMENT_LINK_EXPIRE_MINUTES=30
```

### Webhook URL

Register this URL in the Razorpay Dashboard (Test/Live mode):

```
https://your-api-host/api/v1/payments/webhooks/razorpay
```

Subscribe to events:

- `payment_link.paid`
- `payment_link.cancelled`
- `payment_link.expired`
- `payment.failed`

The endpoint verifies `X-Razorpay-Signature` using `RAZORPAY_WEBHOOK_SECRET` and the raw request body.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/payments` | Customer or staff | `200` |
| `GET` | `/api/v1/payments/:id` | Customer or staff | `200` |
| `POST` | `/api/v1/payments/verify` | Customer JWT | `200` |
| `POST` | `/api/v1/payments/webhooks/razorpay` | Public (signed) | `200` |

---

## GET /api/v1/payments

Paginated payment list. Customers receive only payments for their own orders. Staff require `view-payments` permission.

| | |
|---|---|
| **Auth** | Bearer (customer or staff JWT) |
| **Status** | `200` |

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | `PENDING` \| `COMPLETED` \| `FAILED` \| `REFUNDED` |
| `orderId` | integer | — | Filter by order ID |
| `customerId` | integer | — | Staff only — filter by customer ID |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |

### Example requests

```http
GET /api/v1/payments?page=1&limit=10
GET /api/v1/payments?status=PENDING
GET /api/v1/payments?orderId=7
GET /api/v1/payments?customerId=1
```

### Success response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "orderId": 7,
        "amount": "49999.98",
        "status": "COMPLETED",
        "paymentMethod": "RAZORPAY",
        "paymentLinkUrl": "https://rzp.io/i/xxxx",
        "razorpayPaymentLinkId": "plink_xxxxxxxx",
        "razorpayPaymentId": "pay_xxxxxxxx",
        "keyId": "rzp_test_xxxxxxxx",
        "razorpayOrderId": "order_xxxxxxxx",
        "amountPaise": 4999998,
        "currency": "INR",
        "transactionId": "pay_xxxxxxxx",
        "notes": null,
        "createdAt": "2026-07-10T12:00:00.000Z",
        "updatedAt": "2026-07-10T12:05:00.000Z",
        "order": {
          "id": 7,
          "orderNumber": "ORD-20260710-0001",
          "customerId": 1,
          "status": "CONFIRMED"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | Staff without `view-payments` permission |

### cURL

```bash
# Customer — own payments
curl "http://localhost:5000/api/v1/payments?page=1&limit=10" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Staff — all payments
curl "http://localhost:5000/api/v1/payments?status=PENDING" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/payments/:id

Get payment details including linked order summary and payment link URL.

| | |
|---|---|
| **Auth** | Bearer (customer or staff JWT) |
| **Status** | `200` |

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 1,
    "amount": "49999.98",
    "status": "PENDING",
    "paymentMethod": "RAZORPAY",
    "paymentLinkUrl": "https://rzp.io/i/xxxx",
    "razorpayPaymentLinkId": "plink_xxxxxxxx",
    "razorpayPaymentId": null,
    "transactionId": null,
    "notes": null,
    "createdAt": "2026-07-10T12:00:00.000Z",
    "updatedAt": "2026-07-10T12:00:00.000Z",
    "order": {
      "id": 1,
      "orderNumber": "ORD-20260710-0001",
      "customerId": 1,
      "status": "PENDING"
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `404` | Payment not found (or not owned by customer) |

### cURL

```bash
curl http://localhost:5000/api/v1/payments/1 \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## Razorpay payment flow

```
POST /orders
    → Order (PENDING) + Payment (PENDING) + stock decremented
    → Razorpay Payment Link created
    → Response includes payment.paymentLinkUrl

Customer pays via paymentLinkUrl
    → Razorpay sends webhook to POST /payments/webhooks/razorpay

payment_link.paid
    → Payment COMPLETED, Order CONFIRMED, invoice generated

payment_link.expired / payment.failed / payment_link.cancelled
    → Payment FAILED, Order CANCELLED, stock restored
```

### Frontend integration

1. Call `POST /orders` with cart items and address IDs
2. Read `data.payment.paymentLinkUrl` from the response
3. Redirect the customer to the payment link (new tab or same window)
4. Poll `GET /orders/:id` or `GET /payments/:id` until status changes, or rely on a frontend return URL after payment

If Razorpay link creation fails during checkout, the order is cancelled and stock is restored in the same request.

---

## Razorpay Standard Checkout (embedded modal)

The storefront at `/shop/*` uses **embedded Razorpay Checkout** so customers pay on-site in a modal overlay. This requires backend support beyond Payment Links.

### Backend changes required

#### 1. Update `POST /orders` checkout

When creating an order, call Razorpay **Orders API** (`orders.create`) instead of (or in addition to) Payment Links. Return these fields on `payment`:

| Field | Type | Purpose |
|-------|------|---------|
| `keyId` | string | Razorpay publishable key (`RAZORPAY_KEY_ID`) for frontend |
| `razorpayOrderId` | string | Razorpay order ID passed to checkout modal |
| `amountPaise` | integer | Order total in paise |
| `currency` | string | `INR` |

Keep `paymentLinkUrl` as an optional fallback for legacy clients.

#### 2. New endpoint: `POST /api/v1/payments/verify`

| | |
|---|---|
| **Auth** | Bearer (customer JWT — must own the order) |
| **Status** | `200` |

**Request body:**

```json
{
  "orderId": 1,
  "razorpayPaymentId": "pay_xxxxxxxx",
  "razorpayOrderId": "order_xxxxxxxx",
  "razorpaySignature": "signature_hex"
}
```

**Server action:**

1. Verify HMAC: `hmac_sha256(razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET)`
2. If valid → payment `COMPLETED`, order `CONFIRMED`, generate invoice
3. If invalid → `400 Invalid payment signature`

**Success response:**

```json
{
  "success": true,
  "data": {
    "payment": { "id": 1, "status": "COMPLETED", "..." : "..." },
    "order": { "id": 1, "status": "CONFIRMED", "..." : "..." }
  }
}
```

This gives immediate UI feedback without waiting for the webhook.

#### 3. Webhook updates

Keep existing `payment_link.*` handlers. Also subscribe to:

| Event | Action |
|-------|--------|
| `payment.captured` | Confirm order (idempotent) |
| `payment.failed` | Cancel order, restore stock |

### Frontend integration (implemented)

```ts
// 1. Place order
const order = await POST /orders;

// 2. Open Razorpay modal
const rzp = new Razorpay({
  key: order.payment.keyId,
  amount: order.payment.amountPaise,
  currency: order.payment.currency,
  order_id: order.payment.razorpayOrderId,
  handler: async (response) => {
    await POST /payments/verify {
      orderId: order.id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature,
    };
  },
});
rzp.open();

// 3. Fallback: if only paymentLinkUrl is returned, redirect instead
if (!order.payment.razorpayOrderId && order.payment.paymentLinkUrl) {
  window.location.href = order.payment.paymentLinkUrl;
}
```

Load the script from `https://checkout.razorpay.com/v1/checkout.js`. Never expose `RAZORPAY_KEY_SECRET` on the frontend.

### Payment Links (legacy / fallback)

Payment Links remain supported for backward compatibility:

| Approach | How |
|----------|-----|
| **Same-tab redirect** | `window.location.href = order.payment.paymentLinkUrl` |
| **New tab** | `window.open(order.payment.paymentLinkUrl, '_blank')` |

`paymentLinkUrl` cannot be loaded in an `<iframe>`.

---

## Webhook troubleshooting

### `401 Missing X-Razorpay-Signature`

| Cause | Fix |
|-------|-----|
| Calling webhook from Postman/browser/frontend | **Don't.** Only Razorpay servers call this URL. Use Razorpay Dashboard → Webhooks → **Send test webhook**. |
| Webhook URL points to frontend proxy | Ensure `X-Razorpay-Signature` is forwarded to the NestJS backend. |
| Wrong URL registered | Must be `https://<api-host>/api/v1/payments/webhooks/razorpay` (not the Next.js app URL unless it proxies with headers). |

### `401 Invalid Razorpay signature`

`RAZORPAY_WEBHOOK_SECRET` in `.env` must **exactly match** the secret shown in Razorpay Dashboard when you created the webhook. Re-copy it if you regenerated the secret.

### Local development

Razorpay cannot reach `localhost`. Expose your API with [ngrok](https://ngrok.com/) and register:

```text
https://<your-ngrok-id>.ngrok.io/api/v1/payments/webhooks/razorpay
```

---

## Webhook security

- No JWT — authenticated via HMAC signature only
- Invalid or missing `X-Razorpay-Signature` returns `401`
- Handlers are **idempotent** — duplicate `payment_link.paid` events are ignored if payment is already `COMPLETED`
