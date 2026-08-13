# Careers API

Public career application form (PDF resume) plus staff inbox and status updates.

[← Back to index](./README.md) · [Contact Us](./contact.md)

---

## Overview

```text
1. POST /careers              → upload PDF resume to R2 → save CareerApplication (PENDING)
2. GET  /admin/careers        → staff list inbox (filter by status)
3. GET  /admin/careers/:id    → staff detail
4. PATCH /admin/careers/:id   → update status
```

- **Public submit** — no auth; multipart `name`, `email`, `contactNumber`, `designation`, `experience`, `resume`
- Resume must be a **PDF** (`.pdf` filename, `application/pdf` MIME, `%PDF` magic bytes), max **5 MB**
- Email must be valid (stored lowercase, max 255)
- Contact number must be a valid Indian mobile number (normalized to 10 digits)
- New applications start as `PENDING`
- Staff can set status to `PENDING`, `SHORTLISTED`, `REJECTED`, or `HIRED`

---

## Who can access?

| Endpoint | Auth / permission |
|----------|-------------------|
| `POST /careers` | Public |
| `GET /admin/careers` | Staff (`view-careers`) |
| `GET /admin/careers/:id` | Staff (`view-careers`) |
| `PATCH /admin/careers/:id` | Staff (`update-careers`) |

`SUPER_ADMIN` has all permissions. `ADMIN` is seeded with `view-careers` and `update-careers`.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/careers` | Public | `201` |
| `GET` | `/api/v1/admin/careers` | Staff (`view-careers`) | `200` |
| `GET` | `/api/v1/admin/careers/:id` | Staff (`view-careers`) | `200` |
| `PATCH` | `/api/v1/admin/careers/:id` | Staff (`update-careers`) | `200` |

---

## POST /api/v1/careers

| | |
|---|---|
| **Auth** | None (`@Public`) |
| **Status** | `201` |
| **Content-Type** | `multipart/form-data` |

### Body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | Non-empty, max 120 |
| `email` | string | Yes | Valid email, max 255 |
| `contactNumber` | string | Yes | Indian mobile (`PHONE_PATTERN`), max 20 |
| `designation` | string | Yes | Non-empty, max 120 |
| `experience` | string | Yes | Non-empty, max 100 (e.g. `"Fresher"`, `"3 years"`) |
| `resume` | file | Yes | PDF only, max 5 MB |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/careers \
  -F "name=Priya Sharma" \
  -F "email=priya@example.com" \
  -F "contactNumber=9876543210" \
  -F "designation=Interior Designer" \
  -F "experience=3 years" \
  -F "resume=@./priya-sharma.pdf;type=application/pdf"
```

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "contactNumber": "9876543210",
    "designation": "Interior Designer",
    "experience": "3 years",
    "resumeUrl": "https://uploads.example.com/careers/resumes/2026/08/uuid.pdf",
    "resumeStorageKey": "careers/resumes/2026/08/uuid.pdf",
    "status": "PENDING",
    "createdAt": "2026-08-13T11:40:00.000Z",
    "updatedAt": "2026-08-13T11:40:00.000Z"
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Validation failed, missing resume, non-PDF, or file too large |
| `503` | Cloudflare R2 is not configured |

---

## GET /api/v1/admin/careers

Paginated staff inbox (newest first).

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination (default page `1`, limit `10`, max `100`) |
| `status` | enum | Optional: `PENDING`, `SHORTLISTED`, `REJECTED`, `HIRED` |

```bash
curl "http://localhost:5000/api/v1/admin/careers?page=1&limit=10&status=PENDING" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "contactNumber": "9876543210",
        "designation": "Interior Designer",
        "experience": "3 years",
        "resumeUrl": "https://uploads.example.com/careers/resumes/2026/08/uuid.pdf",
        "resumeStorageKey": "careers/resumes/2026/08/uuid.pdf",
        "status": "PENDING",
        "createdAt": "2026-08-13T11:40:00.000Z",
        "updatedAt": "2026-08-13T11:40:00.000Z"
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

---

## GET /api/v1/admin/careers/:id

```bash
curl "http://localhost:5000/api/v1/admin/careers/1" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Errors

| Status | When |
|--------|------|
| `403` | Missing `view-careers` |
| `404` | Application not found |

---

## PATCH /api/v1/admin/careers/:id

Update application status.

| | |
|---|---|
| **Auth** | Staff Bearer (`update-careers`) |
| **Status** | `200` |

### Body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | enum | Yes | `PENDING`, `SHORTLISTED`, `REJECTED`, or `HIRED` |

### Example

```json
{
  "status": "SHORTLISTED"
}
```

### cURL

```bash
curl -X PATCH http://localhost:5000/api/v1/admin/careers/1 \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"SHORTLISTED"}'
```

### Errors

| Status | When |
|--------|------|
| `400` | Invalid status |
| `403` | Missing `update-careers` |
| `404` | Application not found |

---

## Admin UI mapping

| Button / screen | API |
|-----------------|-----|
| Career inbox | `GET /admin/careers` |
| Application detail | `GET /admin/careers/:id` |
| Update status | `PATCH /admin/careers/:id` |
