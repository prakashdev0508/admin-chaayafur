# Upload Jobs API

Background processing for bulk product image staging and Excel product imports.

[← Back to index](./README.md) · [Products bulk upload](./products.md#bulk-upload)

---

## Overview

Jobs are stored in Postgres (`upload_jobs`) and processed by an in-process worker (`@nestjs/schedule` interval every 10s) on the EC2 instance.

| Type | Source | What it does |
|------|--------|--------------|
| `BULK_PRODUCT_IMAGES` | ZIP upload | Parse `{slug}__{sortOrder}.{ext}`, compress to WebP, upsert `staged_product_images` |
| `BULK_PRODUCT_UPLOAD` | Excel `.xlsx` | Create products per row; attach unconsumed staged images by slug |

### Status lifecycle

`PENDING` → `PROCESSING` → `COMPLETED` | `COMPLETED_WITH_ERRORS` | `FAILED`

- `COMPLETED` — all rows succeeded
- `COMPLETED_WITH_ERRORS` — some rows failed (result workbook still available)
- `FAILED` — job-level failure (corrupt file, missing storage key, etc.)

Stale `PROCESSING` jobs (> 15 minutes) are requeued; after 3 attempts they become `FAILED`.

Disable the worker on a secondary instance with:

```env
UPLOAD_JOB_WORKER_ENABLED=false
```

Unconsumed staged images older than **30 days** are purged daily (DB rows + R2 objects).

---

## Who can access?

Requires `view-products` (ADMIN / SUPER_ADMIN / ORDER_MANAGER).

---

## Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| `GET` | `/api/v1/upload-jobs` | `200` |
| `GET` | `/api/v1/upload-jobs/:id` | `200` |
| `GET` | `/api/v1/upload-jobs/:id/download/uploaded` | `200` (file stream) |
| `GET` | `/api/v1/upload-jobs/:id/download/result` | `200` (file stream) |

---

## GET /api/v1/upload-jobs

| Query | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20`, max `100` |
| `type` | enum | `BULK_PRODUCT_IMAGES` \| `BULK_PRODUCT_UPLOAD` |
| `status` | enum | `PENDING` \| `PROCESSING` \| `COMPLETED` \| `COMPLETED_WITH_ERRORS` \| `FAILED` |

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 13,
        "name": "products.xlsx",
        "type": "BULK_PRODUCT_UPLOAD",
        "status": "COMPLETED_WITH_ERRORS",
        "uploadedUrl": "https://cdn.example.com/product-bulk-imports/2026/07/….xlsx",
        "resultUrl": "https://cdn.example.com/product-bulk-imports/results/2026/07/….xlsx",
        "totalCount": 15,
        "successCount": 12,
        "failedCount": 3,
        "errorMessage": null,
        "attempts": 1,
        "createdById": 1,
        "startedAt": "2026-07-31T06:10:00.000Z",
        "finishedAt": "2026-07-31T06:10:45.000Z",
        "createdAt": "2026-07-31T06:09:55.000Z",
        "updatedAt": "2026-07-31T06:10:45.000Z",
        "download": {
          "uploaded": "/api/v1/upload-jobs/13/download/uploaded",
          "result": "/api/v1/upload-jobs/13/download/result"
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

---

## GET /api/v1/upload-jobs/:id

Same job object as a list item. Poll until `status` is terminal.

### cURL

```bash
curl http://localhost:5000/api/v1/upload-jobs/13 \
  -H "Authorization: Bearer $TOKEN"
```

---

## GET /api/v1/upload-jobs/:id/download/uploaded

Streams the original uploaded file (ZIP or Excel) through the API (auth-gated).

```bash
curl -OJ http://localhost:5000/api/v1/upload-jobs/13/download/uploaded \
  -H "Authorization: Bearer $TOKEN"
```

---

## GET /api/v1/upload-jobs/:id/download/result

Streams the processed result workbook (Excel with `status` / `imagesAttached` columns). Returns `404` until the job has produced a result.

```bash
curl -OJ http://localhost:5000/api/v1/upload-jobs/13/download/result \
  -H "Authorization: Bearer $TOKEN"
```
