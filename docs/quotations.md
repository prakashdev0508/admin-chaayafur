# Quotations API

Staff quotations for walk-in / outbound quotes. The PDF is generated on the frontend, uploaded to R2, then stored on the quotation. Product names and quoted prices are snapshotted so later catalogue edits do not change the quote.

[← Back to index](./README.md) · [Uploads](./uploads.md) · [Products](./products.md)

---

## Overview

```text
1. POST /uploads/quotation-pdfs     → PDF to R2 → { url, key }
2. POST /admin/quotations           → save customer + products + pdfUrl/key
3. GET  /admin/quotations           → list / filter
4. GET  /admin/quotations/:id       → detail
5. PATCH /admin/quotations/:id      → update fields / status / products
6. POST /admin/quotations/:id/remarks     → add follow-up remark
7. POST /admin/quotations/:id/send-email  → email customer with PDF attached
```

- **Staff only** — no public customer endpoints
- Status: `SENT` | `FOLLOW_UP` | `CLOSED` | `CONVERTED` (new quotes default to `SENT`)
- `products[].price` is the **quoted unit price**, snapshotted with `productName` at create/update
- `totalPrice` and `gstAmount` are stored as sent by staff (not recalculated later)
- Follow-up remarks are append-only
- Send-email attaches the PDF from `pdfStorageKey` (R2) when present, otherwise fetches `pdfUrl`

---

## Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /uploads/quotation-pdfs` | `create-quotations` or `update-quotations` |
| `POST /admin/quotations` | `create-quotations` |
| `GET /admin/quotations` | `view-quotations` |
| `GET /admin/quotations/:id` | `view-quotations` |
| `PATCH /admin/quotations/:id` | `update-quotations` |
| `POST /admin/quotations/:id/remarks` | `update-quotations` |
| `POST /admin/quotations/:id/send-email` | `update-quotations` |

`SUPER_ADMIN` has all permissions. Seeded `ADMIN` and `ORDER_MANAGER` include the quotation permissions (re-run `npm run prisma:seed` to refresh existing roles).

---

## Endpoints

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/uploads/quotation-pdfs` | `201` | Upload PDF |
| `POST` | `/api/v1/admin/quotations` | `201` | Create quotation |
| `GET` | `/api/v1/admin/quotations` | `200` | List (`page`, `limit`, `status`, `search`) |
| `GET` | `/api/v1/admin/quotations/:id` | `200` | Detail |
| `PATCH` | `/api/v1/admin/quotations/:id` | `200` | Partial update. Sending `products` replaces the line list |
| `POST` | `/api/v1/admin/quotations/:id/remarks` | `200` | Append a follow-up remark |
| `POST` | `/api/v1/admin/quotations/:id/send-email` | `200` | Email PDF to `email` |

---

## POST /api/v1/admin/quotations

### Request body

```json
{
  "customerName": "Priya Sharma",
  "mobileNumber": "9876543210",
  "email": "priya@example.com",
  "validUntil": "2026-09-15T18:30:00.000Z",
  "address": "H.No. 8-2-293, Banjara Hills, Hyderabad, 500034",
  "notes": "Includes teak finish upgrade",
  "pdfUrl": "https://cdn.example.com/quotations/2026/08/quote.pdf",
  "pdfStorageKey": "quotations/2026/08/8f3c2a1b.pdf",
  "products": [
    { "productId": 1, "quantity": 2, "price": 24999.99 }
  ],
  "totalPrice": 49999.98,
  "gstAmount": 7627.11
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customerName` | string | Yes | |
| `mobileNumber` | string | Yes | Indian mobile; stored as 10 digits |
| `email` | string | Yes | Stored lowercase |
| `validUntil` | ISO datetime | Yes | |
| `address` | string | Yes | Max 500 |
| `notes` | string | No | Max 2000 |
| `pdfUrl` | URL | Yes | From upload |
| `pdfStorageKey` | string | No | From upload `key`; recommended so email can attach from R2 |
| `products` | array | Yes | Min 1, max 50. `productId` must exist. Name is snapshotted |
| `products[].quantity` | integer | Yes | Min 1 |
| `products[].price` | number | Yes | Quoted unit price |
| `totalPrice` | number | Yes | Quoted total |
| `gstAmount` | number | Yes | GST amount on the quote |

`quotationNumber` is assigned as `QT-YYYYMMDD-0001`.

### Success `201`

Same shape as `GET /admin/quotations/:id`.

---

## GET /api/v1/admin/quotations

Query: `page` (default 1), `limit` (default 10, max 100), `status`, `search` (name, mobile, email, quotation number).

---

## PATCH /api/v1/admin/quotations/:id

All create fields optional, plus `status`. Omit `products` to leave lines unchanged; send a new array to replace them.

---

## POST /api/v1/admin/quotations/:id/remarks

```json
{ "remark": "Called customer; will decide after Diwali" }
```

Returns the full quotation including `followUpRemarks`.

---

## POST /api/v1/admin/quotations/:id/send-email

Sends HTML email to the quotation `email` with the PDF attached. Requires Resend (`RESEND_ENABLED` / `RESEND_API_KEY`). If email is disabled, the call still succeeds and the send is skipped (same as other transactional mail).

### Success `200`

```json
{
  "success": true,
  "data": {
    "sent": true,
    "quotationId": 1,
    "quotationNumber": "QT-20260815-0001",
    "to": "priya@example.com",
    "pdfUrl": "https://cdn.example.com/quotations/2026/08/quote.pdf"
  }
}
```

---

## Detail fields

| Field | Description |
|-------|-------------|
| `quotationNumber` | `QT-YYYYMMDD-####` |
| `status` | `SENT` \| `FOLLOW_UP` \| `CLOSED` \| `CONVERTED` |
| `products[]` | `{ id, productId, productName, quantity, price, lineTotal }` — prices as strings |
| `followUpRemarks[]` | `{ id, remark, createdAt }` oldest first |
| `totalPrice` / `gstAmount` | Strings, snapshotted |
| `pdfUrl` / `pdfStorageKey` | PDF location |

`productId` on a line may become `null` if the catalogue product is deleted; `productName` and quoted prices remain.

---

## Errors

| Status | When |
|--------|------|
| `400` | Invalid body, unknown `productId`, or PDF cannot be loaded for email |
| `401` | Missing or invalid token |
| `403` | Missing permission |
| `404` | Quotation not found |
