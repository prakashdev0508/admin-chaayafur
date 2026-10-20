# Careers API

Public job listings and career applications (PDF resume), plus staff job posting management and application inbox.

[← Back to index](./README.md) · [Contact Us](./contact.md)

---

## Overview

```text
1. Admin creates JobPosting (title, description, isActive)
2. GET  /careers/jobs         → public list of active postings
3. GET  /careers/jobs/:id     → public active posting detail
4. POST /careers              → apply to an active posting (PDF → R2 → CareerApplication PENDING)
5. GET  /admin/careers        → staff application inbox
6. PATCH /admin/careers/:id   → update application status
7. Admin job CRUD under /admin/careers/jobs (no hard delete; use isActive)
```

- **Public apply** — no auth; multipart `jobPostingId`, `name`, `email`, `contactNumber`, `experience`, `resume`
- Job posting must exist and be **active** or apply returns an error
- Resume must be a **PDF** (`.pdf` filename, `application/pdf` MIME, `%PDF` magic bytes), max **5 MB**
- Email must be valid (stored lowercase, max 255)
- Contact number must be a valid Indian mobile number (normalized to 10 digits)
- New applications start as `PENDING`
- Staff can set status to `PENDING`, `SHORTLISTED`, `REJECTED`, or `HIRED`
- Job title comes from the linked posting (no free-text designation)

---

## Who can access?

| Endpoint | Auth / permission |
|----------|-------------------|
| `GET /careers/jobs` | Public |
| `GET /careers/jobs/:id` | Public |
| `POST /careers` | Public |
| `GET /admin/careers` | Staff (`view-careers`) |
| `GET /admin/careers/:id` | Staff (`view-careers`) |
| `PATCH /admin/careers/:id` | Staff (`update-careers`) |
| `POST /admin/careers/jobs` | Staff (`create-careers`) |
| `GET /admin/careers/jobs` | Staff (`view-careers`) |
| `GET /admin/careers/jobs/:id` | Staff (`view-careers`) |
| `PATCH /admin/careers/jobs/:id` | Staff (`update-careers`) |

`SUPER_ADMIN` has all permissions. `ADMIN` is seeded with `view-careers`, `create-careers`, and `update-careers`.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/careers/jobs` | Public | `200` |
| `GET` | `/api/v1/careers/jobs/:id` | Public | `200` |
| `POST` | `/api/v1/careers` | Public | `201` |
| `GET` | `/api/v1/admin/careers` | Staff (`view-careers`) | `200` |
| `GET` | `/api/v1/admin/careers/:id` | Staff (`view-careers`) | `200` |
| `PATCH` | `/api/v1/admin/careers/:id` | Staff (`update-careers`) | `200` |
| `POST` | `/api/v1/admin/careers/jobs` | Staff (`create-careers`) | `201` |
| `GET` | `/api/v1/admin/careers/jobs` | Staff (`view-careers`) | `200` |
| `GET` | `/api/v1/admin/careers/jobs/:id` | Staff (`view-careers`) | `200` |
| `PATCH` | `/api/v1/admin/careers/jobs/:id` | Staff (`update-careers`) | `200` |

---

## GET /api/v1/careers/jobs

Paginated **active** job postings (newest first).

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination (default page `1`, limit `10`, max `100`) |

```bash
curl "http://localhost:5000/api/v1/careers/jobs?page=1&limit=10"
```

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Interior Designer",
        "description": "Design residential and commercial furniture layouts for clients.",
        "isActive": true,
        "createdAt": "2026-10-12T10:00:00.000Z",
        "updatedAt": "2026-10-12T10:00:00.000Z"
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

## GET /api/v1/careers/jobs/:id

Returns an **active** posting. Missing or inactive → `404`.

```bash
curl "http://localhost:5000/api/v1/careers/jobs/1"
```

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
| `jobPostingId` | integer | Yes | Must reference an **active** job posting |
| `name` | string | Yes | Non-empty, max 120 |
| `email` | string | Yes | Valid email, max 255 |
| `contactNumber` | string | Yes | Indian mobile (`PHONE_PATTERN`), max 20 |
| `experience` | string | Yes | Non-empty, max 100 (e.g. `"Fresher"`, `"3 years"`) |
| `resume` | file | Yes | PDF only, max 5 MB |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/careers \
  -F "jobPostingId=1" \
  -F "name=Priya Sharma" \
  -F "email=priya@example.com" \
  -F "contactNumber=9876543210" \
  -F "experience=3 years" \
  -F "resume=@./priya-sharma.pdf;type=application/pdf"
```

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "jobPostingId": 1,
    "jobPosting": {
      "id": 1,
      "title": "Interior Designer"
    },
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "contactNumber": "9876543210",
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
| `400` | Validation failed, missing resume, non-PDF, file too large, or posting inactive |
| `404` | Job posting not found |
| `503` | Cloudflare R2 is not configured |

---

## POST /api/v1/admin/careers/jobs

| | |
|---|---|
| **Auth** | Staff Bearer (`create-careers`) |
| **Status** | `201` |

### Body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | Yes | Non-empty, max 200 |
| `description` | string | Yes | Non-empty, max 10000 |
| `isActive` | boolean | No | Default `true` |

```bash
curl -X POST http://localhost:5000/api/v1/admin/careers/jobs \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Interior Designer","description":"Design residential layouts."}'
```

---

## GET /api/v1/admin/careers/jobs

Paginated staff list (all postings; optional `isActive` filter).

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination |
| `isActive` | boolean | Optional filter |

---

## GET /api/v1/admin/careers/jobs/:id

Staff detail (includes inactive postings).

---

## PATCH /api/v1/admin/careers/jobs/:id

Update title, description, and/or `isActive`. No hard delete — set `isActive: false` to close the posting.

```bash
curl -X PATCH http://localhost:5000/api/v1/admin/careers/jobs/1 \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'
```

---

## GET /api/v1/admin/careers

Paginated staff inbox (newest first).

| Param | Type | Description |
|-------|------|-------------|
| `page` / `limit` | integer | Pagination (default page `1`, limit `10`, max `100`) |
| `status` | enum | Optional: `PENDING`, `SHORTLISTED`, `REJECTED`, `HIRED` |
| `jobPostingId` | integer | Optional filter by job posting |

```bash
curl "http://localhost:5000/api/v1/admin/careers?page=1&limit=10&status=PENDING&jobPostingId=1" \
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
        "jobPostingId": 1,
        "jobPosting": {
          "id": 1,
          "title": "Interior Designer"
        },
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "contactNumber": "9876543210",
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
| Job postings list | `GET /admin/careers/jobs` |
| Create job posting | `POST /admin/careers/jobs` |
| Edit / close posting | `PATCH /admin/careers/jobs/:id` |
| Career inbox | `GET /admin/careers` |
| Application detail | `GET /admin/careers/:id` |
| Update status | `PATCH /admin/careers/:id` |
| Public careers page | `GET /careers/jobs` + `POST /careers` |
