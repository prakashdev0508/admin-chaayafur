# Invoices API

JSON invoice snapshots for confirmed orders, plus downloadable PDFs stored on Cloudflare R2. Each order can have **two** invoices: a **Performa** invoice when payment is received, and a **Tax invoice** when the order is delivered.

[← Back to index](./README.md) · [Orders](./orders.md) · [Payments](./payments.md) · [Site Settings](./site-settings.md)

---

## Overview

### Invoice types

| Type | DB enum | Number prefix | When generated | Template |
|------|---------|---------------|----------------|----------|
| **Performa** | `PERFORMA` | `PF-YYYYMMDD-XXXX` | Order becomes `CONFIRMED` (payment received) | `performa-invoice.html` |
| **Tax** | `TAX` | `TXI-YYYYMMDD-XXXX` | Order becomes `DELIVERED` | `tax-invoice.html` |

Each order stores at most one row per type (`@@unique([orderId, invoiceType])`). Both have their own `pdfUrl` / `pdfStorageKey`.

### Auto-generation

Invoice JSON + PDF are generated **synchronously** when the order status changes (same request path; failures are logged and do not roll back the status update).

| Trigger | Invoice type generated |
|---------|------------------------|
| Razorpay paid webhook (`PENDING` → `CONFIRMED`) | Performa (`PERFORMA`) |
| Staff `POST /admin/orders/:id/mark-paid` (`PENDING` → `CONFIRMED`) | Performa (`PERFORMA`) |
| Staff `PATCH` order → `CONFIRMED` | Performa (`PERFORMA`) |
| Staff `PATCH` order → `DELIVERED` | Tax (`TAX`) |
| Staff edits items / floor on a confirmed order (before delivery) when an invoice already exists | Performa refresh |

Staff can also **manually** generate/refresh either type via `POST /orders/:id/invoice/generate`.

### PDF rendering

- Both templates are rendered via Chromium (`puppeteer-core` + `@sparticuz/chromium` on serverless), uploaded to R2 (`invoices/{year}/{month}/…`), and linked via `pdfUrl`
- Logo, phone, email, showroom address, and GSTIN come from **site settings**; legal company name, PAN, website, HSN, GST rate, and terms come from **invoice env config** (see `.env.example`)
- Made in India logo is loaded from `public/madeinindia.png`
- Static décor assets live under `src/modules/invoices/templates/assets/` (`bill-decor.png`, `ship-decor.png`, `quality-badge.png`) and are injected as data URIs at PDF render time
- Invoice text uses bundled **Noto Sans** (`templates/assets/fonts/`) via `@font-face` data URIs; PDF generation waits for `document.fonts.ready` before capture
- Layout is **compact** (smaller logo/header) on both templates
- **No signature image** — both templates show: *This is a computer generated Invoice*
- Bank details and QR code blocks are **not** shown; footer social glyphs are visual-only

### Performa vs Tax template differences

| Feature | Performa (`PF`) | Tax (`TXI`) |
|---------|-----------------|-------------|
| Title | PERFORMA INVOICE | TAX INVOICE |
| Line-item columns | Item Description, EDD, HSN Code, Tax %, Qty, Net Value, Total | S. No., Description, HSN, Qty, Unit, Rate, Taxable Value, GST rate/amount, Total |
| EDD column | Order `createdAt` (formatted) | — |
| Tax summary | **Total Tax** only (no CGST/SGST split) | Total Taxable Value + CGST + SGST |
| Signature | Computer-generated text | Computer-generated text |

### Pricing / tax math

- Product prices are treated as **GST-inclusive** by default (`INVOICE_GST_RATE`, default `18`) so taxable value / CGST / SGST are reverse-calculated for the PDF
- The invoice JSON snapshot `taxAmount` field remains `0` (tax is computed at render time)
- Shipping and floor-delivery charges appear as extra line items when non-zero; discounts reduce taxable/GST before the grand total
- Invoice data is a **snapshot** at generation time (billing address, line items, prices)
- Line items include customization names and **product-level price adjustments** snapped from the order

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

## GET /api/v1/orders/:id/invoice

Returns **both** invoice types for an order. Either (or both) may be `null` if not yet generated.

| | |
|---|---|
| **Auth** | Bearer (customer or staff JWT) |
| **Status** | `200` or `404` when neither invoice exists |

### Success response

```json
{
  "success": true,
  "data": {
    "performa": {
      "id": 1,
      "orderId": 1,
      "invoiceType": "PERFORMA",
      "invoiceNumber": "PF-20260710-0001",
      "issuedAt": "2026-07-10T12:08:00.000Z",
      "billingName": "John Doe",
      "billingAddress": "456 Business Park, Mumbai, Maharashtra, 400002, IN",
      "subtotal": "5000.00",
      "discountAmount": "500.00",
      "shippingAmount": "499.00",
      "deliveryFloor": 3,
      "liftAccessAvailable": false,
      "floorDeliveryAmount": "900.00",
      "taxAmount": "0.00",
      "totalAmount": "5899.00",
      "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid-pf.pdf",
      "lineItems": [ "..." ],
      "createdAt": "2026-07-10T12:08:00.000Z",
      "updatedAt": "2026-07-10T12:08:00.000Z",
      "order": {
        "orderNumber": "ORD-20260710-0001",
        "customer": { "id": 1, "phone": "+919876543210" }
      }
    },
    "tax": null
  }
}
```

After delivery, `tax` is populated with `invoiceType: "TAX"` and `invoiceNumber` like `TXI-20260715-0001`.

### Line item fields

| Field | Description |
|-------|-------------|
| `name` | Product name with selected customizations in parentheses when present |
| `unitPrice` | Captured order line unit price (base + adjustments) |
| `hsnCode` | Product HSN when set; template falls back to `INVOICE_HSN` |
| `woodName` / `polishName` / `fabricName` | Selected option names (or `null`) |
| `woodPriceAdjustment` / `polishPriceAdjustment` / `fabricPriceAdjustment` | Snapshotted product-level adjustments |

---

## POST /api/v1/orders/:id/invoice/generate

Generate or refresh a **single** invoice type synchronously (creates snapshot + uploads PDF immediately).

| | |
|---|---|
| **Auth** | Staff Bearer (`update-orders`) |
| **Status** | `200` |

### Request body (required)

```json
{
  "invoiceType": "pf"
}
```

| `invoiceType` | Maps to |
|---------------|---------|
| `"pf"` | Performa (`PERFORMA`) |
| `"txi"` | Tax (`TAX`) |

Returns `400` if `invoiceType` is missing or not one of `pf` / `txi`.

- Creates the invoice if missing; regenerates snapshot if one already exists
- Always re-uploads a new PDF (`pdfUrl` / `pdfStorageKey` updated; previous R2 object deleted when replaced)
- Requires R2 env vars (`503` if storage is not configured)

```bash
# Performa
curl -X POST http://localhost:5000/api/v1/orders/1/invoice/generate \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceType":"pf"}'

# Tax invoice
curl -X POST http://localhost:5000/api/v1/orders/1/invoice/generate \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceType":"txi"}'
```

### Success response

Single invoice object (same shape as each entry in `GET /orders/:id/invoice`):

```json
{
  "success": true,
  "data": {
    "id": 2,
    "orderId": 1,
    "invoiceType": "TAX",
    "invoiceNumber": "TXI-20260715-0001",
    "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid-txi.pdf",
    "totalAmount": "5899.00"
  }
}
```

---

## POST /api/v1/orders/:id/invoice/email

Create the **tax** invoice (and PDF) if missing, then email the PDF to the customer’s shipping/billing address email.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-orders`) |
| **Status** | `200` |

- Creates/regenerates the **Tax (`TXI`)** invoice only
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
    "invoiceNumber": "TXI-20260716-0001",
    "to": "priya@example.com",
    "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid.pdf"
  }
}
```

---

## GET /api/v1/orders/:id/invoice/pdf

Redirects to the public R2 PDF URL.

- If a PDF already exists (`pdfUrl` set), that file is served (no re-render).
- If the invoice row or PDF is missing, the API creates the snapshot (if needed), renders the PDF, uploads it to R2, then redirects.

### Query parameters

| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `invoiceType` | No | `pf` (Performa) or `txi` (Tax) | `txi` |

```bash
# Tax invoice (default)
curl -L "http://localhost:5000/api/v1/orders/1/invoice/pdf" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -o tax-invoice.pdf

# Performa invoice
curl -L "http://localhost:5000/api/v1/orders/1/invoice/pdf?invoiceType=pf" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -o performa-invoice.pdf
```

### Errors

| Status | When |
|--------|------|
| `403` | Customer accessing another customer's invoice |
| `404` | Order not found |
| `503` | PDF could not be generated (R2 not configured, or render/upload failed) |

---

## Environment

```env
# Invoice PDF templates (see .env.example for full list)
INVOICE_COMPANY_NAME=FURNITURES TALES INDIA PRIVATE LIMITED
INVOICE_GST_RATE=18
INVOICE_PRICES_TAX_INCLUSIVE=true
```

---

## Order detail embed

`GET /orders/:id` includes invoice summaries:

- `performa` — Performa (`PF-…`) after payment confirm
- `tax` — Tax (`TXI-…`) after delivery
- `invoice` — convenience: performa if present, otherwise tax

```json
"performa": {
  "id": 1,
  "invoiceType": "PERFORMA",
  "invoiceNumber": "PF-20260710-0001",
  "issuedAt": "2026-07-10T12:08:00.000Z",
  "totalAmount": "5899.00",
  "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid-pf.pdf"
},
"tax": null,
"invoice": {
  "id": 1,
  "invoiceType": "PERFORMA",
  "invoiceNumber": "PF-20260710-0001",
  "issuedAt": "2026-07-10T12:08:00.000Z",
  "totalAmount": "5899.00",
  "pdfUrl": "https://cdn.example.com/invoices/2026/07/uuid-pf.pdf"
}
```

Use `GET /orders/:id/invoice` for both Performa and Tax full JSON payloads.
