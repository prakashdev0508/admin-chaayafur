# Invoices API

JSON invoice snapshots for confirmed orders. No PDF generation in this phase.

[← Back to index](./README.md) · [Orders](./orders.md) · [Payments](./payments.md)

---

## Overview

- Invoices are **auto-generated** when an order is confirmed (via Razorpay webhook or staff action)
- Generation is **idempotent** — calling confirm/payment complete twice does not create duplicate invoices
- Invoice data is a **snapshot** at generation time (billing address, line items, prices)
- `taxAmount` defaults to `0` — GST/tax calculation can be added later
- Invoice numbers follow the format `INV-YYYYMMDD-XXXX` (sequential per day)

### When is an invoice created?

| Trigger | Example |
|---------|---------|
| Razorpay `payment_link.paid` webhook | Auto-confirms `PENDING` order |
| Staff sets order status to `CONFIRMED` | `PATCH /orders/:id` |

### Who can access?

| Endpoint | Customer | Staff |
|----------|:--------:|:-----:|
| `GET /orders/:id/invoice` | Own order | All (`view-orders`) |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/orders/:id/invoice` | Customer or staff | `200` |

---

## GET /api/v1/orders/:id/invoice

Get the JSON invoice for an order.

| | |
|---|---|
| **Auth** | Bearer (customer or staff JWT) |
| **Status** | `200` |

Customers can only access invoices for their own orders.

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 1,
    "invoiceNumber": "INV-20260710-0001",
    "issuedAt": "2026-07-10T12:30:00.000Z",
    "billingName": "John Doe",
    "billingAddress": "456 Business Park, Mumbai, Maharashtra, 400002, IN",
    "subtotal": "49999.98",
    "taxAmount": "0.00",
    "totalAmount": "49999.98",
    "lineItems": [
      {
        "productId": 1,
        "name": "Oak Dining Table",
        "slug": "oak-dining-table",
        "quantity": 2,
        "unitPrice": "24999.99",
        "lineTotal": "49999.98"
      }
    ],
    "createdAt": "2026-07-10T12:30:00.000Z",
    "updatedAt": "2026-07-10T12:30:00.000Z",
    "order": {
      "orderNumber": "ORD-20260710-0001",
      "customer": {
        "id": 1,
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210"
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `invoiceNumber` | string | Unique invoice ID (`INV-YYYYMMDD-XXXX`) |
| `issuedAt` | string | ISO timestamp when invoice was issued |
| `billingName` | string | Customer name or email fallback |
| `billingAddress` | string | Billing address snapshot from order |
| `subtotal` | string | Subtotal (decimal string) |
| `taxAmount` | string | Tax amount (defaults to `0.00`) |
| `totalAmount` | string | Total amount (decimal string) |
| `lineItems` | array | Snapshot of order line items |
| `lineItems[].productId` | integer | Product ID |
| `lineItems[].name` | string | Product name at invoice time |
| `lineItems[].quantity` | integer | Quantity ordered |
| `lineItems[].unitPrice` | string | Unit price at invoice time |
| `lineItems[].lineTotal` | string | Line total |

### Errors

| Status | When |
|--------|------|
| `403` | Customer accessing another customer's invoice |
| `404` | Order not found, or invoice not yet generated |

> Invoice not found (`404`) means the order has not been confirmed yet. Confirm the order or complete the payment first.

### cURL

```bash
curl http://localhost:5000/api/v1/orders/1/invoice \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## Invoice data model

Invoices are stored in the `Invoice` table with a one-to-one relation to `Order`.

| DB field | Description |
|----------|-------------|
| `orderId` | Unique — one invoice per order |
| `invoiceNumber` | Unique human-readable number |
| `billingName` | Customer display name |
| `billingAddress` | Text snapshot |
| `subtotal` | `Decimal(10,2)` |
| `taxAmount` | `Decimal(10,2)`, default 0 |
| `totalAmount` | `Decimal(10,2)` |
| `lineItems` | `JSON` array snapshot |
