# Refunds API

Two-phase staff refund flow for completed Razorpay payments: initiate with reason → complete (calls Razorpay) → processed or failed, with a full event timeline.

[← Back to index](./README.md) · [Payments](./payments.md) · [Orders](./orders.md)

---

## Overview

```text
1. POST /orders/:id/refund                    → INITIATED (who, when, required reason)
2. POST /orders/:id/refund/:refundId/complete → PROCESSING → Razorpay refund API
3. Gateway result                             → PROCESSED or FAILED
4. On PROCESSED only                          → payment REFUNDED, order CANCELLED, stock/coupon restored
```

- **Full refund only** (v1) — amount always matches the payment total
- Payment stays `COMPLETED` until refund is `PROCESSED`, then payment → `REFUNDED`
- Side effects (cancel order, restore stock/coupon) run **only** on `PROCESSED`
- Cancelling an order via `PATCH /orders/:id` does **not** auto-refund — refund is always explicit
- At most **one active** refund (`INITIATED` or `PROCESSING`) per payment

### Refund statuses

| Status | Meaning |
|--------|---------|
| `INITIATED` | Staff created refund request with reason — Razorpay not called yet |
| `PROCESSING` | Complete clicked; Razorpay refund submitted |
| `PROCESSED` | Money refunded; payment `REFUNDED`; order cancelled + stock/coupon restored |
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
| `POST /orders/:id/refund` | `update-payments` | Yes | Yes | No |
| `POST /orders/:id/refund/:refundId/complete` | `update-payments` | Yes | Yes | No |
| `POST /orders/:id/refund/:refundId/cancel` | `update-payments` | Yes | Yes | No |
| `GET /orders/:id/refund` | `view-payments` **or** `view-orders` | Yes | Yes | No |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/orders/:id/refund` | Staff (`update-payments`) | `201` |
| `POST` | `/api/v1/orders/:id/refund/:refundId/complete` | Staff (`update-payments`) | `200` |
| `POST` | `/api/v1/orders/:id/refund/:refundId/cancel` | Staff (`update-payments`) | `200` |
| `GET` | `/api/v1/orders/:id/refund` | Staff (`view-payments` or `view-orders`) | `200` |

---

## POST /api/v1/orders/:id/refund

Initiate a full refund for a **COMPLETED** payment. Does **not** call Razorpay.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-payments`) |
| **Status** | `201` |
| **Body** | `{ "reason": "…" }` **required** (min 3 chars, max 2000) |

### Preconditions

- Order exists and has a payment
- Payment status is `COMPLETED`
- No active refund (`INITIATED` / `PROCESSING`) already exists for the payment

### Success response

```json
{
  "success": true,
  "data": {
    "id": 3,
    "orderId": 1,
    "paymentId": 1,
    "status": "INITIATED",
    "reason": "Customer requested cancellation after delivery delay",
    "amount": "14999.00",
    "initiatedByStaffId": 2,
    "initiatedAt": "2026-07-14T09:00:00.000Z",
    "completedByStaffId": null,
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

Returns the **latest** refund for the order, including full `events` timeline.

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
| `id` | integer | Refund ID |
| `orderId` | integer | Order ID |
| `paymentId` | integer | Payment ID |
| `status` | string | `INITIATED` \| `PROCESSING` \| `PROCESSED` \| `FAILED` \| `CANCELLED` |
| `reason` | string | Staff reason at initiate |
| `amount` | string | Full refund amount (decimal string) |
| `initiatedByStaffId` | integer | Who initiated |
| `initiatedAt` | string | ISO timestamp |
| `completedByStaffId` | integer \| null | Who clicked Complete |
| `completedAt` | string \| null | When Complete was clicked |
| `processedAt` | string \| null | When refund finalized |
| `failedAt` | string \| null | When refund failed |
| `failureReason` | string \| null | Gateway / API failure message |
| `razorpayRefundId` | string \| null | Razorpay refund id (`rfnd_…`) |
| `events` | array | Ordered timeline of refund steps |

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

1. `Payment.status` → `REFUNDED`
2. Mirror `razorpayRefundId`, `refundedAt`, `refundNotes` (= reason) onto `Payment`
3. If order is not already `CANCELLED` → order `CANCELLED` + status event
4. Restore product stock and coupon redemption

---

## Admin UI mapping

| Button / screen | API |
|-----------------|-----|
| Initiate refund (reason form) | `POST /orders/:id/refund` |
| Complete refund | `POST /orders/:id/refund/:refundId/complete` |
| Cancel request | `POST /orders/:id/refund/:refundId/cancel` |
| Refund history / timeline | `GET /orders/:id/refund` |
