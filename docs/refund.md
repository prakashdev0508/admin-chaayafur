# Refunds API

Two-phase staff refund flow for completed Razorpay payments: initiate with reason → complete (calls Razorpay) → processed or failed, with a full event timeline.

[← Back to index](./README.md) · [Payments](./payments.md) · [Orders](./orders.md)

---

## Overview

```text
1. POST /orders/:id/refund                    → Refund row INITIATED (Order.status unchanged)
2. POST /orders/:id/refund/:refundId/complete → Refund PROCESSING → Razorpay refund API
3. Gateway result                             → Refund PROCESSED or FAILED
4. On PROCESSED                               → if fully refunded: payment REFUNDED + stock/coupon restored
                                              → if partial: payment stays COMPLETED
```

- **Order.status and Refund.status are separate** — fulfillment stays on the order; refund lifecycle lives on `refunds`
- **Partial or full refunds** — optional `amount` on initiate; omit to refund the full remaining balance
- Multiple sequential refunds allowed until remaining balance is `0`
- Payment stays `COMPLETED` until the payment is **fully** refunded, then → `REFUNDED`
- Side effects (restore stock/coupon) run **only** when the payment becomes fully refunded
- Cancelling an order via `PATCH /orders/:id` does **not** auto-refund — refund is always explicit
- At most **one active** refund (`INITIATED` or `PROCESSING`) per payment
- Staff order list supports `?refundStatus=INITIATED` to find orders with an open refund
- Global refund inbox: `GET /refunds` and `GET /refunds/:id`
- **Customer emails (Resend)** — refund initiated (includes amount) and refund completed; see [orders.md](./orders.md) for env vars. Recipient = shipping/billing address email; skipped if missing

### Refund statuses

| Status | Meaning |
|--------|---------|
| `INITIATED` | Staff created refund request with reason — Razorpay not called yet |
| `PROCESSING` | Complete clicked; Razorpay refund submitted |
| `PROCESSED` | Money refunded for this request; payment becomes `REFUNDED` only when remaining balance is 0 |
| `FAILED` | Razorpay API or `refund.failed` webhook reported failure |
| `CANCELLED` | Staff cancelled before clicking Complete |

### Event timeline types

| Event | When |
|-------|------|
| `INITIATED` | Staff creates refund with reason |
| `COMPLETE_REQUESTED` | Staff clicks Complete |
| `GATEWAY_ACCEPTED` | Razorpay accepted the refund request (`razorpayRefundId` stored) |
| `PROCESSED` | Refund finalized (API terminal success or `refund.processed` webhook) |
| `FAILED` | Razorpay API error or `refund.failed` webhook |
| `CANCELLED` | Staff cancelled an `INITIATED` request |

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /refunds` | `view-payments` **or** `view-orders` | Yes | Yes | No |
| `GET /refunds/:id` | `view-payments` **or** `view-orders` | Yes | Yes | No |
| `POST /orders/:id/refund` | `update-payments` | Yes | Yes | No |
| `POST /orders/:id/refund/:refundId/complete` | `update-payments` | Yes | Yes | No |
| `POST /orders/:id/refund/:refundId/cancel` | `update-payments` | Yes | Yes | No |
| `GET /orders/:id/refund` | `view-payments` **or** `view-orders` | Yes | Yes | No |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/refunds` | Staff (`view-payments` or `view-orders`) | `200` |
| `GET` | `/api/v1/refunds/:id` | Staff (`view-payments` or `view-orders`) | `200` |
| `POST` | `/api/v1/orders/:id/refund` | Staff (`update-payments`) | `201` |
| `POST` | `/api/v1/orders/:id/refund/:refundId/complete` | Staff (`update-payments`) | `200` |
| `POST` | `/api/v1/orders/:id/refund/:refundId/cancel` | Staff (`update-payments`) | `200` |
| `GET` | `/api/v1/orders/:id/refund` | Staff (`view-payments` or `view-orders`) | `200` |

---

## GET /api/v1/refunds

Paginated staff refund inbox.

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination |
| `status` | string | `INITIATED` \| `PROCESSING` \| `PROCESSED` \| `FAILED` \| `CANCELLED` |
| `orderId` | integer | Exact order id |
| `orderNumber` | string | Partial order number match |
| `createdFrom` / `createdTo` | string | Date range on refund `createdAt` |

```bash
curl "http://localhost:5000/api/v1/refunds?status=INITIATED" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/refunds/:id

Single refund with events, balances, and order summary.

```bash
curl "http://localhost:5000/api/v1/refunds/12" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## POST /api/v1/orders/:id/refund

Initiate a refund for a **COMPLETED** payment (partial or full remaining). Does **not** call Razorpay.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `201` |
| **Body** | `{ "reason": "…", "amount"?: number }` — `reason` required; `amount` optional |

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `reason` | string | Yes | Min 3, max 2000 chars |
| `amount` | number | No | Min `0.01`, max 2 decimal places. Omit to refund **full remaining** balance |

### Preconditions

- Order exists and has a payment
- Payment status is `COMPLETED` (not yet fully refunded)
- No active refund (`INITIATED` / `PROCESSING`) already exists for the payment
- If `amount` is set, it must be `≤ remaining` (`payment.amount − sum of PROCESSED refunds`)

### Example — partial refund

```json
{
  "reason": "Damaged item — partial goodwill credit",
  "amount": 500
}
```

### Success response

Includes balance fields for the staff UI:

```json
{
  "success": true,
  "data": {
    "id": 3,
    "orderId": 1,
    "paymentId": 1,
    "status": "INITIATED",
    "reason": "Damaged item — partial goodwill credit",
    "amount": "500.00",
    "paymentAmount": "14999.00",
    "refundedAmount": "0.00",
    "remainingAmount": "14999.00",
    "initiatedByStaffId": 2,
    "initiatedBy": {
      "id": 2,
      "firstName": "Priya",
      "lastName": "Sharma",
      "email": "priya@chaaya.com"
    },
    "initiatedAt": "2026-07-14T09:00:00.000Z",
    "completedByStaffId": null,
    "completedBy": null,
    "completedAt": null,
    "processedAt": null,
    "failedAt": null,
    "failureReason": null,
    "razorpayRefundId": null,
    "createdAt": "2026-07-14T09:00:00.000Z",
    "updatedAt": "2026-07-14T09:00:00.000Z",
    "events": [
      {
        "id": 1,
        "type": "INITIATED",
        "actorType": "STAFF",
        "actorId": 2,
        "message": "Customer requested cancellation after delivery delay",
        "metadata": null,
        "createdAt": "2026-07-14T09:00:00.000Z"
      }
    ]
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/refund \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Customer requested cancellation after delivery delay"}'
```

### Errors

| Status | When |
|--------|------|
| `400` | Payment not completed, already refunded, missing payment, or active refund exists |
| `403` | Missing `update-payments` |
| `404` | Order not found |

---

## POST /api/v1/orders/:id/refund/:refundId/complete

Staff clicks **Complete refund** — moves status to `PROCESSING` and calls Razorpay `payments.refund`.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `200` |
| **Precondition** | Refund status must be `INITIATED` |

### Gateway behaviour

| Razorpay result | Local outcome |
|-----------------|---------------|
| API success, status `processed` | Immediately `PROCESSED` + payment/order side-effects |
| API success, status `pending` | Stays `PROCESSING` until `refund.processed` webhook |
| API error | `FAILED` with `failureReason`; order/payment unchanged |

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/refund/3/complete \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Events after a successful complete (terminal)

`COMPLETE_REQUESTED` → `GATEWAY_ACCEPTED` → `PROCESSED`

### Errors

| Status | When |
|--------|------|
| `400` | Refund not `INITIATED`, or payment missing Razorpay payment id |
| `403` | Missing `update-payments` |
| `404` | Order/refund not found |
| `500` | Razorpay refund API failed (refund marked `FAILED`) |

---

## POST /api/v1/orders/:id/refund/:refundId/cancel

Cancel an `INITIATED` refund before completion.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `200` |
| **Precondition** | Status must be `INITIATED` |

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/refund/3/cancel \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/orders/:id/refund

Returns refunds for the order: balance summary, `items` (all refunds newest first), plus the latest refund fields at the top level for backward compatibility.

| | |
|---|---|
| **Auth** | Staff Bearer (`view-payments` or `view-orders`) |
| **Status** | `200` |

```bash
curl http://localhost:5000/api/v1/orders/1/refund \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `paymentAmount` | string | Original payment amount |
| `refundedAmount` | string | Sum of `PROCESSED` refund amounts |
| `remainingAmount` | string | `paymentAmount − refundedAmount` |
| `items` | array | All refunds for the order (newest first) |
| `id` | integer | Latest refund ID |
| `orderId` | integer | Order ID |
| `paymentId` | integer | Payment ID |
| `status` | string | Latest refund status |
| `reason` | string | Staff reason at initiate |
| `amount` | string | This refund request amount (decimal string) |
| `initiatedByStaffId` | integer | Who initiated (scalar id) |
| `initiatedBy` | object | `{ id, firstName, lastName, email }` |
| `initiatedAt` | string | ISO timestamp |
| `completedByStaffId` | integer \| null | Who clicked Complete |
| `completedBy` | object \| null | `{ id, firstName, lastName, email }` or `null` |
| `completedAt` | string \| null | When Complete was clicked |
| `processedAt` | string \| null | When refund finalized |
| `failedAt` | string \| null | When refund failed |
| `failureReason` | string \| null | Gateway / API failure message |
| `razorpayRefundId` | string \| null | Razorpay refund id (`rfnd_…`) |
| `events` | array | Ordered timeline of the latest refund |

### Errors

| Status | When |
|--------|------|
| `403` | Missing view permission |
| `404` | Order not found, or no refund exists for the order |

---

## Webhooks

Subscribe in Razorpay Dashboard (same URL as payments — see [payments.md](./payments.md)):

- `refund.processed` — finalizes refund → `PROCESSED` (idempotent if already processed)
- `refund.failed` — marks refund → `FAILED` (**does not** cancel order or restore stock)

Resolve by `razorpayRefundId`. If refund is already `PROCESSED` / `FAILED`, webhook is a no-op.

---

## Side effects on PROCESSED

**Partial refund** (remaining balance &gt; 0):

1. Payment stays `COMPLETED`
2. **Order.status is unchanged**
3. Mirror latest `razorpayRefundId` / notes onto `Payment` for audit
4. Stock and coupon are **not** restored

**Full refund** (remaining balance = 0):

1. `Payment.status` → `REFUNDED`
2. Mirror `razorpayRefundId`, `refundedAt`, `refundNotes` (= reason) onto `Payment`
3. **Order.status is unchanged**
4. Restore product stock and coupon redemption (unless order is `CANCELLED`)

Initiating or cancelling a refund only updates `Refund.status` — never `Order.status`.

---

## Admin UI mapping

| Button / screen | API |
|-----------------|-----|
| Refund list / inbox | `GET /refunds` |
| Refund detail | `GET /refunds/:id` |
| Initiate refund (reason form) | `POST /orders/:id/refund` |
| Complete refund | `POST /orders/:id/refund/:refundId/complete` |
| Cancel request | `POST /orders/:id/refund/:refundId/cancel` |
| Order-scoped refund history | `GET /orders/:id/refund` |
