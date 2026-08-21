# Uploads API

Staff endpoints for uploading product, category, and sub-category images to **Cloudflare R2**. Uploaded files are optimized to WebP and return a public URL + storage key for use in product/category/sub-category create/update payloads.

[← Back to index](./README.md) · [Products docs](./products.md) · [Categories docs](./categories.md)

---

## Overview

1. **Upload** image(s) via multipart form → receive `url` + `key`
2. **Attach** to a product via `POST /products` or `PATCH /products/:id` in the `images` array, or paste comma-separated `url` values into the product [bulk upload](./products.md#bulk-upload) Excel `images` column, or attach to a category/sub-category via `image: { url, storageKey }`

```text
Admin UI  →  POST /uploads/product-images  →  R2 bucket
           →  POST/PATCH /products { images: [{ url, storageKey }] }
           →  or Excel bulk upload images column (comma-separated urls)

Admin UI  →  POST /uploads/category-images  →  R2 bucket
           →  POST/PATCH /categories { image: { url, storageKey } }

Admin UI  →  POST /uploads/sub-category-images  →  R2 bucket
           →  POST/PATCH /sub-categories { image: { url, storageKey } }
```

### Processing

- Allowed input types: `image/jpeg`, `image/png`, `image/webp`
- Images are auto-rotated, resized (max dimension 2000px by default), and converted to **WebP**
- **Product images** (single, batch, and bulk ZIP staging): compressed to **≤ 1 MB**. If the optimized WebP is already under 1 MB, it is stored as-is (no extra compression)
- **Other images** (category, sub-category, banner, logo, favicon): compressed to **≤ 200 KB**
- **Support / customization / order-line images**: compressed to **≤ 500 KB** (order-line images use the product pipeline, ≤ 1 MB)
- Default max upload size: **5 MB** per file (`R2_MAX_UPLOAD_BYTES`)

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /uploads/product-images` | `create-products` **or** `update-products` | Yes | Yes | No |
| `POST /uploads/product-images/batch` | `create-products` **or** `update-products` | Yes | Yes | No |
| `POST /uploads/category-images` | `create-categories` **or** `update-categories` | Yes | Yes | No |
| `POST /uploads/sub-category-images` | `create-categories` **or** `update-categories` | Yes | Yes | No |
| `POST /uploads/banner-images` | `create-banners` **or** `update-banners` | Yes | Yes | No |
| `POST /uploads/logo-images` | `update-settings` | Yes | Yes | No |
| `POST /uploads/favicon-images` | `update-settings` | Yes | Yes | No |
| `POST /uploads/support-images` | Customer JWT | Yes | No | No |
| `POST /uploads/support-images/batch` | Customer JWT | Yes | No | No |
| `POST /uploads/customization-images` | Customer JWT | Yes | No | No |
| `POST /uploads/order-line-images` | `create-orders` **or** `update-orders` | Yes | Yes | Yes |
| `POST /uploads/quotation-pdfs` | `create-quotations` **or** `update-quotations` | Yes | Yes | Yes |

---

## Environment variables

Set in `.env` (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `R2_BUCKET_NAME` | No | Default `chaaya-uploads` |
| `R2_PUBLIC_BASE_URL` | Yes | Public CDN/custom domain base URL (no trailing slash) |
| `R2_ENDPOINT` | No | Defaults to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_MAX_UPLOAD_BYTES` | No | Default `5242880` (5 MB) — max incoming file size |
| `R2_MAX_PRODUCT_OUTPUT_BYTES` | No | Default `1048576` (1 MB) — max stored product WebP size |
| `R2_MAX_OUTPUT_BYTES` | No | Default `204800` (200 KB) — max stored WebP for category/sub-category/banner/logo/favicon |
| `R2_MAX_IMAGE_DIMENSION` | No | Default `2000` |
| `R2_WEBP_QUALITY` | No | Starting WebP quality before auto-compression (default `85`) |

> Enable public access on the bucket via a custom domain or R2 public bucket URL. `R2_PUBLIC_BASE_URL` must match the URL customers will load in the browser.

---

## Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| `POST` | `/api/v1/uploads/product-images` | `201` |
| `POST` | `/api/v1/uploads/product-images/batch` | `201` |
| `POST` | `/api/v1/uploads/category-images` | `201` |
| `POST` | `/api/v1/uploads/sub-category-images` | `201` |
| `POST` | `/api/v1/uploads/banner-images` | `201` |
| `POST` | `/api/v1/uploads/logo-images` | `201` |
| `POST` | `/api/v1/uploads/favicon-images` | `201` |
| `POST` | `/api/v1/uploads/support-images` | `201` |
| `POST` | `/api/v1/uploads/support-images/batch` | `201` |
| `POST` | `/api/v1/uploads/customization-images` | `201` |
| `POST` | `/api/v1/uploads/order-line-images` | `201` |
| `POST` | `/api/v1/uploads/quotation-pdfs` | `201` |

---

## POST /api/v1/uploads/product-images

Upload a single product image.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### Success response

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/products/2026/07/8f3c2a1b.webp",
    "key": "products/2026/07/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp",
    "contentType": "image/webp",
    "size": 182344
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/product-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/table.jpg"
```

---

## POST /api/v1/uploads/product-images/batch

Upload up to **5** images in one request.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Content-Type** | `multipart/form-data` |
| **Field** | `files` (multiple binaries) |
| **Status** | `201` |

### Success response

```json
{
  "success": true,
  "data": [
    {
      "url": "https://cdn.example.com/products/2026/07/image-1.webp",
      "key": "products/2026/07/uuid-1.webp",
      "contentType": "image/webp",
      "size": 150000
    }
  ]
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/product-images/batch \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/front.jpg" \
  -F "files=@/path/to/side.jpg"
```

---

## POST /api/v1/uploads/category-images

Upload a single category image (stored under `categories/{year}/{month}/…`).

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `create-categories` or `update-categories` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### Success response

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/categories/2026/07/8f3c2a1b.webp",
    "key": "categories/2026/07/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp",
    "contentType": "image/webp",
    "size": 182344
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/category-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/bedroom.jpg"
```

### Attach to a category

```json
{
  "name": "Bedroom",
  "slug": "bedroom",
  "isSignatureCollection": true,
  "image": {
    "url": "https://cdn.example.com/categories/2026/07/8f3c2a1b.webp",
    "storageKey": "categories/2026/07/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp"
  }
}
```

---

## POST /api/v1/uploads/sub-category-images

Upload a single sub-category image (stored under `sub-categories/{year}/{month}/…`).

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `create-categories` or `update-categories` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### Success response

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/sub-categories/2026/08/8f3c2a1b.webp",
    "key": "sub-categories/2026/08/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp",
    "contentType": "image/webp",
    "size": 182344
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/sub-category-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/beds.jpg"
```

### Attach to a sub-category

```json
{
  "name": "Beds",
  "slug": "beds",
  "categoryId": 1,
  "image": {
    "url": "https://cdn.example.com/sub-categories/2026/08/8f3c2a1b.webp",
    "storageKey": "sub-categories/2026/08/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp"
  }
}
```

---

## POST /api/v1/uploads/banner-images

Upload a single home banner image (stored under `banners/{year}/{month}/…`).

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `create-banners` or `update-banners` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/banner-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/hero.jpg"
```

Attach via [home.md](./home.md) (`POST` / `PATCH /admin/home/banners`) using `imageUrl` + `imageStorageKey`.

---

## POST /api/v1/uploads/logo-images

Upload a site logo (stored under `branding/logo/{year}/{month}/…`).

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `update-settings` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/logo-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/logo.png"
```

Attach via [site-settings.md](./site-settings.md) (`PUT /admin/site-settings`) using `logoUrl` + `logoStorageKey`.

---

## POST /api/v1/uploads/favicon-images

Upload a site favicon (stored under `branding/favicon/{year}/{month}/…`).

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `update-settings` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary) |
| **Status** | `201` |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/uploads/favicon-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/favicon.png"
```

Attach via [site-settings.md](./site-settings.md) using `faviconUrl` + `faviconStorageKey`.

---

## Attach to a product

Pass the upload response into the product `images` array. Include `storageKey` (the `key` from upload) so replaced images are deleted from R2 automatically.

```json
{
  "name": "Oak Dining Table",
  "slug": "oak-dining-table",
  "price": 24999.99,
  "stock": 10,
  "subCategoryId": 1,
  "images": [
    {
      "url": "https://cdn.example.com/products/2026/07/8f3c2a1b.webp",
      "storageKey": "products/2026/07/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.webp",
      "altText": "Oak dining table front view",
      "sortOrder": 0
    }
  ]
}
```

See [products.md](./products.md) for full product API details.

---

## POST /api/v1/uploads/quotation-pdfs

Upload a quotation PDF. Returns `url` + `key` for `POST /admin/quotations`.

| | |
|---|---|
| **Auth** | Staff (`create-quotations` or `update-quotations`) |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (binary PDF) |
| **Status** | `201` |

Must be a PDF (`.pdf`, `application/pdf`, `%PDF` magic). Then attach `url` as `pdfUrl` and `key` as `pdfStorageKey` on the quotation. See [quotations.md](./quotations.md).

---

## Errors

| Status | When |
|--------|------|
| `400` | Missing file, invalid image, unsupported type, or file too large |
| `401` | Missing or invalid token |
| `403` | Missing `create-products` or `update-products` permission |
| `503` | R2 is not configured (`R2_*` env vars missing) |
