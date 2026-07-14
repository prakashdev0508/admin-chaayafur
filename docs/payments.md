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
- Staff can issue a **two-phase full refund** via order refund APIs (`update-payments`) — initiate with required reason, then **Complete refund** calls Razorpay; payment becomes `REFUNDED` only when refund is `PROCESSED`
- Webhooks handle `refund.processed` / `refund.failed` idempotently
- Staff can **poll** payment status via `GET /payments/:id` — no manual status updates
- Staff can **list** all payments via `GET /payments`; customers see only their own order payments

### Payment statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting Razorpay payment (default for new orders) |
| `COMPLETED` | Payment received via Razorpay |
| `FAILED` | Payment failed, link expired, or checkout could not create a link |
| `REFUNDED` | Full refund completed via admin refund or `refund.processed` webhook |

### Payment method

All payments use `RAZORPAY` (Payment Links).

### Who can access?

| Endpoint | Customer | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|:--------:|:-----------:|:-----:|:-------------:|
| `GET /payments` | Own payments | All | All | All |
| `GET /payments/:id` | Own order | All | All | All |
| `POST /orders/:id/refund` | No | Yes (`update-payments`) | Yes | No |
| `POST /orders/:id/refund/:refundId/complete` | No | Yes (`update-payments`) | Yes | No |
| `POST /orders/:id/refund/:refundId/cancel` | No | Yes (`update-payments`) | Yes | No |
| `GET /orders/:id/refund` | No | Yes (`view-payments` or `view-orders`) | Yes | No |
| `POST /payments/webhooks/razorpay` | Public (Razorpay) | — | — | — |

---

## Two-phase refund flow

```text
1. POST /orders/:id/refund          → INITIATED (who, when, required reason) — no Razorpay call
2. POST /orders/:id/refund/:id/complete → PROCESSING → Razorpay refund API
3. Gateway result                   → PROCESSED or FAILED
4. On PROCESSED only                → payment REFUNDED, order CANCELLED, stock/coupon restored
```

### Refund statuses

| Status | Meaning |
|--------|---------|
| `INITIATED` | Staff created refund request with reason |
| `PROCESSING` | Complete clicked; Razorpay refund submitted |
| `PROCESSED` | Money refunded; order side-effects applied |
| `FAILED` | Razorpay API or webhook reported failure |
| `CANCELLED` | Staff cancelled before completing |

### Step 1 — POST /api/v1/orders/:id/refund

Initiate a full refund for a **COMPLETED** payment.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `201` |
| **Body** | `{ "reason": "…" }` **required** (min 3 chars) |

Does **not** call Razorpay. Blocks a second active refund (`INITIATED` or `PROCESSING`) on the same payment.

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/refund \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Customer requested cancellation after delivery delay"}'
```

### Step 2 — POST /api/v1/orders/:id/refund/:refundId/complete

Staff clicks **Complete refund** — calls Razorpay `payments.refund` for the full amount.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `200` |
| **Precondition** | Refund status must be `INITIATED` |

If Razorpay returns `processed` immediately → refund `PROCESSED` in one response. If `pending` → stays `PROCESSING` until `refund.processed` webhook.

On Razorpay API error → refund `FAILED` with `failureReason`.

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/refund/3/complete \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Cancel — POST /api/v1/orders/:id/refund/:refundId/cancel

Only when status is `INITIATED`. Status → `CANCELLED`.

### GET /api/v1/orders/:id/refund

Returns the latest refund with full **event timeline** (`INITIATED`, `COMPLETE_REQUESTED`, `GATEWAY_ACCEPTED`, `PROCESSED`, `FAILED`, `CANCELLED`).

```json
{
  "success": true,
  "data": {
    "id": 3,
    "orderId": 1,
    "paymentId": 1,
    "status": "INITIATED",
    "reason": "Customer requested cancellation",
    "amount": "14999.00",
    "initiatedByStaffId": 2,
    "initiatedAt": "2026-07-14T09:00:00.000Z",
    "completedByStaffId": null,
    "completedAt": null,
    "processedAt": null,
    "failedAt": null,
    "failureReason": null,
    "razorpayRefundId": null,
    "events": [
      {
        "type": "INITIATED",
        "actorType": "STAFF",
        "actorId": 2,
        "message": "Customer requested cancellation",
        "createdAt": "2026-07-14T09:00:00.000Z"
      }
    ]
  }
}
```

**Does not** auto-refund when staff only `PATCH`es status to `CANCELLED` — refund is always explicit.

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
- `refund.processed`
- `refund.failed`

The endpoint verifies `X-Razorpay-Signature` using `RAZORPAY_WEBHOOK_SECRET` and the raw request body.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/payments` | Customer or staff | `200` |
| `GET` | `/api/v1/payments/:id` | Customer or staff | `200` |
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

## Storefront integration (React / Next.js)

This API uses **Razorpay Payment Links** — a hosted Razorpay page, not an embeddable checkout widget.

### Do not use an iframe

`paymentLinkUrl` (`https://rzp.io/...`) **cannot** be loaded in an `<iframe>`. Razorpay blocks embedding with `X-Frame-Options` / CSP for security. You will get a blank frame or browser error.

Use one of these instead:

| Approach | How |
|----------|-----|
| **Same-tab redirect** (recommended) | `window.location.href = order.payment.paymentLinkUrl` |
| **New tab** | `window.open(order.payment.paymentLinkUrl, '_blank')` |

### Typical checkout flow

```ts
// 1. Place order
const res = await fetch('/api/v1/orders', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ items, shippingAddressId, billingAddressId }),
});
const { data: order } = await res.json();

// 2. Redirect to Razorpay (not iframe)
window.location.href = order.payment.paymentLinkUrl;

// 3. After customer pays, Razorpay calls your backend webhook (server-to-server).
//    Your app should NOT call POST /payments/webhooks/razorpay.

// 4. On a "payment pending" or return page, poll until confirmed:
const poll = setInterval(async () => {
  const tracking = await fetch(`/api/v1/orders/${order.id}/tracking`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  if (tracking.data.currentStatus !== 'PENDING') {
    clearInterval(poll);
    // navigate to success or failure page
  }
}, 3000);
```

### Embedded modal checkout (not implemented)

If you need payment to stay on your page (modal overlay), you need **Razorpay Standard Checkout** (Orders API + frontend `razorpay` script), not Payment Links. That requires backend changes (`orders.create` on Razorpay, new webhook events like `payment.captured`). The current API only returns `paymentLinkUrl`.

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
