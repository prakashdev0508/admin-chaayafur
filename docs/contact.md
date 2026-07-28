# Contact Us API

Public Contact Us form for the website, plus staff inbox and email reply.

[← Back to index](./README.md) · [Site Settings](./site-settings.md)

---

## Overview

```text
1. POST /contact                  → save ContactInquiry → email SiteSettings.email (if set)
2. GET  /admin/contact            → staff list inbox
3. GET  /admin/contact/:id        → staff detail
4. POST /admin/contact/:id/reply  → email reply to submitter → store reply on inquiry
```

- **Public submit** — no auth; required `fullName`, `email`, `message`; optional `phone`, `companyName`, `subject`
- Phone, when provided, must be a valid Indian mobile number (normalized to 10 digits)
- New-inquiry notify uses Resend → `SiteSettings.email`; skipped if missing or Resend disabled (submit still succeeds)
- **Admin reply** emails the submitter’s address; fails with `503` if Resend is not configured
- Re-reply is allowed (overwrites latest `replyMessage` / `repliedAt` / staff)

---

## Who can access?

| Endpoint | Auth / permission |
|----------|-------------------|
| `POST /contact` | Public |
| `GET /admin/contact` | Staff (`view-settings`) |
| `GET /admin/contact/:id` | Staff (`view-settings`) |
| `POST /admin/contact/:id/reply` | Staff (`update-settings`) |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/contact` | Public | `201` |
| `GET` | `/api/v1/admin/contact` | Staff (`view-settings`) | `200` |
| `GET` | `/api/v1/admin/contact/:id` | Staff (`view-settings`) | `200` |
| `POST` | `/api/v1/admin/contact/:id/reply` | Staff (`update-settings`) | `200` |

---

## POST /api/v1/contact

| | |
|---|---|
| **Auth** | None (`@Public`) |
| **Status** | `201` |

### Body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `fullName` | string | Yes | Non-empty, max 120 |
| `email` | string | Yes | Valid email, max 255 |
| `phone` | string | No | Indian mobile (`PHONE_PATTERN`), max 20 |
| `companyName` | string | No | Non-empty if set, max 120 |
| `subject` | string | No | Non-empty if set, max 200 |
| `message` | string | Yes | Non-empty, max 2000 |

### Example

```json
{
  "fullName": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "9876543210",
  "companyName": "Chaaya Interiors",
  "subject": "Custom dining set inquiry",
  "message": "I would like a quote for a 6-seater teak dining table."
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "9876543210",
    "companyName": "Chaaya Interiors",
    "subject": "Custom dining set inquiry",
    "message": "I would like a quote for a 6-seater teak dining table."
  }'
```

### Errors

| Status | When |
|--------|------|
| `400` | Validation failed (invalid email/phone, missing required fields, too long) |

---

## GET /api/v1/admin/contact

Paginated staff inbox (newest first).

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination (default page `1`, limit `10`, max `100`) |

```bash
curl "http://localhost:5000/api/v1/admin/contact?page=1&limit=10" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/admin/contact/:id

```bash
curl "http://localhost:5000/api/v1/admin/contact/1" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Errors

| Status | When |
|--------|------|
| `403` | Missing `view-settings` |
| `404` | Inquiry not found |

---

## POST /api/v1/admin/contact/:id/reply

Sends the reply to the inquiry submitter’s email, then stores it on the inquiry.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-settings`) |
| **Status** | `200` |
| **Body** | `{ "reply": "…" }` |

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `reply` | string | Yes | Non-empty, max 2000 |

### Example

```json
{
  "reply": "Thank you for your interest. We can prepare a custom teak dining quote — please share preferred dimensions."
}
```

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "9876543210",
    "companyName": "Chaaya Interiors",
    "subject": "Custom dining set inquiry",
    "message": "I would like a quote for a 6-seater teak dining table.",
    "replyMessage": "Thank you for your interest. We can prepare a custom teak dining quote — please share preferred dimensions.",
    "repliedAt": "2026-07-28T05:45:00.000Z",
    "repliedByStaffId": 2,
    "repliedBy": {
      "id": 2,
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@chaaya.com"
    },
    "createdAt": "2026-07-28T05:20:00.000Z",
    "updatedAt": "2026-07-28T05:45:00.000Z"
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/admin/contact/1/reply \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reply":"Thank you for your interest. We can prepare a custom teak dining quote."}'
```

### Errors

| Status | When |
|--------|------|
| `400` | Validation failed |
| `403` | Missing `update-settings` |
| `404` | Inquiry not found |
| `503` | Resend email is not configured |

---

## Admin UI mapping

| Button / screen | API |
|-----------------|-----|
| Contact inbox | `GET /admin/contact` |
| Inquiry detail | `GET /admin/contact/:id` |
| Send reply | `POST /admin/contact/:id/reply` |
