# Invoices API

JSON invoice snapshots for confirmed orders, plus downloadable PDF stored on Cloudflare R2.

[← Back to index](./README.md) · [Orders](./orders.md) · [Payments](./payments.md) · [Site Settings](./site-settings.md)

---

## Overview

- Invoices are **auto-generated** when an order is confirmed via Razorpay payment webhook (not when staff confirms via admin PATCH)
- Staff can create/refresh an invoice with `POST /orders/:id/invoice/generate`, or email it with `POST /orders/:id/invoice/email`
- Generation is **idempotent** — calling confirm/payment complete twice does not create duplicate invoices
- On generate/regenerate, a **PDF** is built with `pdfkit`, uploaded to R2 (`invoices/{year}/{month}/…`), and linked via `pdfUrl`
- PDF layout matches a branded Magento-style invoice: logo + store header, brown/charcoal hero bar, bill-to block, items table, totals, thank-you footer
- Logo comes from **site settings** (`logoStorageKey` / `logoUrl`); WebP logos are converted to PNG for PDFKit; brand contact/GSTIN/support email also come from settings
- Theme colors are brown (`#8B5E3C`) + charcoal — not yellow
- Invoice data is a **snapshot** at generation time (billing address, line items, prices)
- `totalAmount` = subtotal − discount + shipping + tax
- Invoice numbers follow the format `INV-YYYYMMDD-XXXX` (sequential per day)

### When is an invoice created?

| Trigger | Example |
|---------|---------|
| Razorpay paid webhook | Auto-confirms `PENDING` order → invoice generated |
| Staff `POST /orders/:id/invoice/generate` | Manual create/refresh + PDF upload |
| Staff `POST /orders/:id/invoice/email` | Creates invoice if missing, then emails PDF |
| Staff sets order status to `CONFIRMED` | **Does not** auto-generate an invoice |

### Who can access?

| Endpoint | Customer | Staff |
|----------|:--------:|:-----:|
| `GET /orders/:id/invoice` | Own order | All (`view-orders`) |
| `POST /orders/:id/invoice/generate` | No | `update-orders` |
| `POST /orders/:id/invoice/email` | No | `update-orders` |
| `GET /orders/:id/invoice/pdf` | Own order | All (`view-orders`) |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/orders/:id/invoice` | Customer or staff | `200` |
| `POST` | `/api/v1/orders/:id/invoice/generate` | Staff (`update-orders`) | `200` |
| `POST` | `/api/v1/orders/:id/invoice/email` | Staff (`update-orders`) | `200` |
| `GET` | `/api/v1/orders/:id/invoice/pdf` | Customer or staff | `302` redirect to PDF URL |

---

## POST /api/v1/orders/:id/invoice/email

Create the invoice (and PDF) if missing, then email the PDF to the customer’s shipping/billing address email.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-orders`) |
| **Status** | `200` |

- Creates invoice snapshot if none exists
- Builds/uploads PDF when possible (R2)
- Sends Resend email with PDF attached (+ download link when `pdfUrl` is available)
- Returns `400` if the order has no customer email on shipping/billing address

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/invoice/email \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Success response

```json
{
  "success": true,
  "data": {
    "sent": true,
    "orderId": 1,
    "orderNumber": "ORD-20260716-0001",
    "invoiceNumber": "INV-20260716-0001",
    "to": "priya@example.com",
    "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid.pdf"
  }
}
```

---

## POST /api/v1/orders/:id/invoice/generate

Generate or refresh the invoice snapshot, build a PDF with `pdfkit`, upload it to Cloudflare R2, and return the invoice including `pdfUrl`.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-orders`) |
| **Status** | `200` |

- Creates the invoice if missing; regenerates snapshot if one already exists
- Always re-uploads a new PDF (`pdfUrl` / `pdfStorageKey` updated; previous R2 object deleted when replaced)
- If an older invoice has `pdfUrl` but a missing `pdfStorageKey`, the previous object key is derived from the public URL when possible
- Requires R2 env vars (`503` if storage is not configured)

```bash
curl -X POST http://localhost:5000/api/v1/orders/1/invoice/generate \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Success response

Same shape as `GET /orders/:id/invoice`, with a non-null `pdfUrl`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 1,
    "invoiceNumber": "INV-20260714-0001",
    "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid.pdf",
    "totalAmount": "14999.00"
  }
}
```

---

## GET /api/v1/orders/:id/invoice

Get the JSON invoice for an order.

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
    "invoiceNumber": "INV-20260710-0001",
    "issuedAt": "2026-07-10T12:30:00.000Z",
    "billingName": "John Doe",
    "billingAddress": "456 Business Park, Mumbai, Maharashtra, 400002, IN",
    "subtotal": "5000.00",
    "discountAmount": "500.00",
    "shippingAmount": "499.00",
    "taxAmount": "0.00",
    "totalAmount": "4999.00",
    "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid.pdf",
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
        "phone": "+919876543210"
      }
    }
  }
}
```

---

## GET /api/v1/orders/:id/invoice/pdf

Redirects to the public R2 PDF URL. If an older invoice has no PDF yet, the API generates and uploads one on demand (requires R2 configured).

```bash
curl -L http://localhost:5000/api/v1/orders/1/invoice/pdf \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -o invoice.pdf
```

### Errors

| Status | When |
|--------|------|
| `403` | Customer accessing another customer's invoice |
| `404` | Order not confirmed / invoice missing, or PDF unavailable (e.g. R2 not configured) |
