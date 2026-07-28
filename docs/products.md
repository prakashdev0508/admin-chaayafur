# Products API

Create, update, and list furniture products.

[← Back to index](./README.md) · [Categories docs](./categories.md) · [Woods](./woods.md) · [Fabrics](./fabrics.md) · [Home / CMS](./home.md) · [Auth docs](./auth.md) · [Orders / checkout](./orders.md)

---

## Overview

- **No delete endpoint** — use `isActive: false` to soft-hide products
- **Product images** — upload via [uploads.md](./uploads.md) (Cloudflare R2), then attach URLs in product create/update (max **5** per product)
- **`productFeatures`** — optional array of feature strings (e.g. `"Solid oak wood"`, `"1-year warranty"`) for product detail bullets; max **10** items, 200 chars each
- **Bulk Excel upload** — download a sample template, upload images first to get URLs, then import products via `.xlsx` (see [Bulk upload](#bulk-upload))
- **CMS tags** — optional booleans `isBestSeller`, `isFeaturedProduct`, `isMostPopular`, `isNewArrival` for storefront sections; filter with `GET /products?tag=isFeaturedProduct`, or assign via `PATCH /admin/cms/products/:id/tags` (see [home.md](./home.md))
- Aggregated home sections: [home.md](./home.md) (`GET /home`)
- Default list shows only **active** products (`isActive=true`)
- **`price`** is the selling price (after discount) — used for cart, checkout, and filters
- **`priceWithoutDiscount`** is optional compare-at / MRP; display-only, does not affect checkout
- **`woods`** — product wood options with nested polishes (see [woods.md](./woods.md)); detail includes unavailable woods with `isAvailable: false`
- **`fabrics`** — product fabric options (see [fabrics.md](./fabrics.md)); same availability pattern as woods; independent of wood
- Products link to **`subCategoryId`** (not top-level `categoryId`)
- Public list responses are **cached** in Upstash Redis (60s default) and return `Cache-Control` headers for CDN edge caching
- Cache is invalidated automatically when products, categories, or sub-categories are created or updated

### Sub-category assignment

Use a sub-category ID from [categories.md](./categories.md). Example after seed:

| Parent | Sub-category | `subCategoryId` |
|--------|--------------|-----------------|
| Bedroom | Beds | `1` |
| Living | Coffee Tables | (use `GET /sub-categories`) |

> `subCategoryId` must reference a row in the `SubCategory` table.

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /products` | `create-products` | Yes | Yes | No |
| `GET /products/bulk-upload/sample` | `create-products` | Yes | Yes | No |
| `POST /products/bulk-upload` | `create-products` | Yes | Yes | No |
| `PATCH /products/:id` | `update-products` | Yes | Yes | No |
| `PATCH /admin/cms/products/:id/tags` | `update-products` | Yes | Yes | No |
| `POST /uploads/product-images` | `create-products` or `update-products` | Yes | Yes | No |
| `GET /products` | **Public** | — | — | — |
| `GET /products/filters` | **Public** | — | — | — |
| `GET /products/:idOrSlug` | **Public** | — | — | — |

---

## Endpoints

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `POST` | `/api/v1/products` | `create-products` | `201` |
| `GET` | `/api/v1/products/bulk-upload/sample` | `create-products` | `200` |
| `POST` | `/api/v1/products/bulk-upload` | `create-products` | `201` |
| `PATCH` | `/api/v1/products/:id` | `update-products` | `200` |
| `GET` | `/api/v1/products` | **Public** | `200` |
| `GET` | `/api/v1/products/filters` | **Public** | `200` |
| `GET` | `/api/v1/products/:idOrSlug` | **Public** | `200` |

`GET /products` is a public, cacheable endpoint. Responses include:

```http
Cache-Control: public, max-age=60, s-maxage=300
```

Protected endpoints (`POST`, `PATCH`) require:

```http
Authorization: Bearer <accessToken>
```

---

## POST /api/v1/products

### Request body

```json
{
  "name": "Oak Dining Table",
  "slug": "oak-dining-table",
  "description": "Solid oak dining table for 6 people",
  "price": 24999.99,
  "priceWithoutDiscount": 29999.99,
  "stock": 10,
  "subCategoryId": 1,
  "isActive": true,
  "isBestSeller": false,
  "isFeaturedProduct": true,
  "isMostPopular": false,
  "isNewArrival": true,
  "productFeatures": [
    "Solid oak wood",
    "Seats 6 people",
    "1-year warranty"
  ],
  "images": [
    {
      "url": "https://cdn.example.com/products/oak-table.webp",
      "storageKey": "products/2026/07/8f3c2a1b.webp",
      "altText": "Oak dining table front view",
      "sortOrder": 0
    }
  ]
}
```

### Request fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique across all products |
| `description` | string | No | — |
| `price` | number | Yes | Min `0`. **Selling price** (after discount). Used for cart, checkout, and filters. |
| `priceWithoutDiscount` | number | No | Min `0`. Compare-at / MRP before discount. Optional; does not affect checkout. |
| `stock` | number | Yes | Min `0` |
| `subCategoryId` | integer | Yes | Must exist in `SubCategory` table |
| `isActive` | boolean | No | Default `true` |
| `isBestSeller` | boolean | No | Default `false` — CMS merchandising tag |
| `isFeaturedProduct` | boolean | No | Default `false` — CMS merchandising tag |
| `isMostPopular` | boolean | No | Default `false` — CMS merchandising tag |
| `isNewArrival` | boolean | No | Default `false` — CMS merchandising tag |
| `productFeatures` | string[] | No | Max 10 items; each string max 200 chars. Default `[]` |
| `woods` | array | No | `{ woodId, isActive? }[]` — assign woods for this product. Pass `[]` to clear. See [woods.md](./woods.md) |
| `fabrics` | array | No | `{ fabricId, isActive? }[]` — assign fabrics for this product. Pass `[]` to clear. See [fabrics.md](./fabrics.md) |
| `images` | array | No | Max 5 items. Upload files first via [uploads.md](./uploads.md); include `storageKey` from upload response |

### Success response `201`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "description": "Solid oak dining table for 6 people",
    "price": "24999.99",
    "priceWithoutDiscount": "29999.99",
    "stock": 10,
    "isActive": true,
    "isBestSeller": false,
    "isFeaturedProduct": true,
    "isMostPopular": false,
    "isNewArrival": true,
    "productFeatures": [
      "Solid oak wood",
      "Seats 6 people",
      "1-year warranty"
    ],
    "subCategoryId": 1,
    "subCategory": {
      "id": 1,
      "name": "Beds",
      "slug": "beds",
      "heading": "Beds",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom"
      }
    },
    "images": [
      {
        "id": 10,
        "url": "https://cdn.example.com/products/oak-table.jpg",
        "storageKey": "products/2026/07/8f3c2a1b.webp",
        "altText": "Oak dining table front view",
        "sortOrder": 0
      }
    ],
    "ratingAverage": null,
    "reviewCount": 0,
    "createdAt": "2026-07-09T18:02:58.000Z",
    "updatedAt": "2026-07-09T18:02:58.000Z"
  }
}
```

> `price` is returned as a **string** for decimal precision.
> Always round-trip `storageKey` when updating images so kept files are not deleted from R2.
> `ratingAverage` / `reviewCount` reflect visible product reviews only — see [reviews.md](./reviews.md).
> When `images` is sent on update, only storage keys that are **no longer** in the new list are deleted from Cloudflare R2.

### Errors

| Status | When |
|--------|------|
| `400` | Invalid payload |
| `401` | Missing or invalid token |
| `403` | Missing `create-products` permission |
| `404` | Sub-category not found |
| `409` | Slug already exists |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "price": 24999.99,
    "stock": 10,
    "subCategoryId": 1,
    "productFeatures": ["Solid oak wood", "Seats 6 people"]
  }'
```

---

## Bulk upload

Import many products from an Excel (`.xlsx`) sheet. Failed rows do not stop the batch; each row gets a `status` in a result workbook stored on R2.

### Workflow

1. Download the sample template: `GET /api/v1/products/bulk-upload/sample`
2. Upload product images via [uploads.md](./uploads.md) (`POST /uploads/product-images`) and copy the returned `url` values into the sheet `images` column
3. Fill one product per row and upload: `POST /api/v1/products/bulk-upload`

### Excel columns

Header names must match exactly (case-insensitive). Backend appends **`status`** only on the result file.

| Column | Required | Format |
|--------|----------|--------|
| `name` | Yes | string |
| `slug` | Yes | unique slug |
| `description` | No | string |
| `price` | Yes | number |
| `priceWithoutDiscount` | No | number |
| `stock` | Yes | integer ≥ 0 |
| `subCategoryId` | Yes | integer |
| `isActive` | No | `true` / `false` (default true) |
| `isBestSeller` | No | `true` / `false` |
| `isFeaturedProduct` | No | `true` / `false` |
| `isMostPopular` | No | `true` / `false` |
| `isNewArrival` | No | `true` / `false` |
| `productFeatures` | No | pipe-separated, max 10: `Solid oak\|Seats 6\|1-year warranty` |
| `images` | No | comma-separated public URLs, max 5 |
| `woods` | No | comma-separated wood IDs: `1,2` |
| `fabrics` | No | comma-separated fabric IDs: `3,4` |
| `status` | Backend-only | `Success` or error message |

Limits: max **500** data rows per file, max **5 MB** `.xlsx`.

---

## GET /api/v1/products/bulk-upload/sample

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Status** | `200` |
| **Response** | Excel file download (`product-bulk-upload-sample.xlsx`) |

### cURL

```bash
curl -OJ http://localhost:5000/api/v1/products/bulk-upload/sample \
  -H "Authorization: Bearer $TOKEN"
```

---

## POST /api/v1/products/bulk-upload

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (`.xlsx`) |
| **Status** | `201` |

Processes every non-empty data row. Partial failures are expected; use `successCount` / `failedCount` and the result document.

### Success response `201`

```json
{
  "success": true,
  "data": {
    "successCount": 12,
    "failedCount": 3,
    "documentUrl": "https://cdn.example.com/product-bulk-imports/2026/07/8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b.xlsx"
  }
}
```

The result workbook contains all original columns plus a final **`status`** column (`Success` or the error message).

### Errors (whole request)

| Status | When |
|--------|------|
| `400` | Missing/invalid file, wrong sheet headers, empty sheet, or more than 500 rows |
| `401` | Missing or invalid token |
| `403` | Missing `create-products` permission |
| `503` | R2 storage is not configured (cannot store the result document) |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/products/bulk-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./products.xlsx"
```

---

## PATCH /api/v1/products/:id

Partial update. All body fields are optional.

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | — |
| `slug` | string | Unique across all products |
| `description` | string | — |
| `price` | number | Min `0`. Selling price (after discount). |
| `priceWithoutDiscount` | number | Min `0`. Compare-at / MRP before discount. |
| `stock` | number | Min `0` |
| `subCategoryId` | integer | Must exist in `SubCategory` table |
| `isActive` | boolean | Set `false` to hide product |
| `isBestSeller` | boolean | CMS tag |
| `isFeaturedProduct` | boolean | CMS tag |
| `isMostPopular` | boolean | CMS tag |
| `isNewArrival` | boolean | CMS tag |
| `productFeatures` | string[] | Replace entire list. Pass `[]` to clear all features |
| `images` | array | Replaces all images when provided (max 5) |

### cURL

```bash
curl -X PATCH http://localhost:5000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productFeatures": [
      "Solid oak wood",
      "Easy assembly",
      "Free delivery"
    ]
  }'
```

Hide a product:

```bash
curl -X PATCH http://localhost:5000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

## GET /api/v1/products/:idOrSlug

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns full product details for the storefront product page. Accepts either a **numeric product ID** or a **slug**. Only **active** products (`isActive=true`) are returned; hidden products respond with `404`.

| Path value | Lookup |
|------------|--------|
| Digits only (`7`) | By product ID |
| Slug (`oak-dining-table`) | By product slug |

### Examples

```http
GET /api/v1/products/7
GET /api/v1/products/oak-dining-table
```

### Success response `200`

Same shape as the create/update response: `description`, full `images` array, `productFeatures`, `subCategory`, etc.

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "description": "Solid oak dining table for 6 people",
    "price": "24999.99",
    "priceWithoutDiscount": "29999.99",
    "stock": 10,
    "isActive": true,
    "isBestSeller": false,
    "isFeaturedProduct": true,
    "isMostPopular": false,
    "isNewArrival": true,
    "productFeatures": [
      "Solid oak wood",
      "Seats 6 people",
      "1-year warranty"
    ],
    "subCategoryId": 1,
    "subCategory": {
      "id": 1,
      "name": "Beds",
      "slug": "beds",
      "heading": "Beds",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom"
      }
    },
    "images": [
      {
        "id": 10,
        "url": "https://cdn.example.com/products/oak-table.jpg",
        "storageKey": "products/2026/07/8f3c2a1b.webp",
        "altText": "Oak dining table front view",
        "sortOrder": 0
      }
    ],
    "ratingAverage": 4.5,
    "reviewCount": 12,
    "createdAt": "2026-07-09T18:02:58.000Z",
    "updatedAt": "2026-07-09T18:02:58.000Z"
  }
}
```

### Errors

| Status | When |
|--------|------|
| `404` | Product not found or inactive |

### cURL

```bash
curl "http://localhost:5000/api/v1/products/7"
curl "http://localhost:5000/api/v1/products/oak-dining-table"
```

---

## GET /api/v1/products/filters

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns filter metadata for the storefront product listing page: active categories with nested sub-categories (and product counts), active-product price range, CMS tag options, and sort options.

Responses are cached in Redis (60s default) and invalidated when products or categories change.

### Example

```http
GET /api/v1/products/filters
```

### Success response `200`

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom",
        "productCount": 12,
        "subCategories": [
          {
            "id": 1,
            "name": "Beds",
            "slug": "beds",
            "productCount": 5
          }
        ]
      }
    ],
    "priceRange": {
      "min": 999,
      "max": 99999
    },
    "tags": [
      { "value": "isBestSeller", "label": "Best Seller", "productCount": 3 },
      { "value": "isFeaturedProduct", "label": "Featured", "productCount": 8 },
      { "value": "isMostPopular", "label": "Most Popular", "productCount": 4 },
      { "value": "isNewArrival", "label": "New Arrival", "productCount": 6 }
    ],
    "sortOptions": [
      { "value": "createdAt", "label": "Newest", "order": "desc" },
      { "value": "price", "label": "Price: Low to High", "order": "asc" }
    ]
  }
}
```

### cURL

```bash
curl "http://localhost:5000/api/v1/products/filters"
```

---

## GET /api/v1/products

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Paginated product catalogue for the storefront. Defaults to **active** products only (`isActive=true`).

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | — | Case-insensitive partial match |
| `slug` | string | — | Exact match |
| `minPrice` | number | — | `price >= minPrice` |
| `maxPrice` | number | — | `price <= maxPrice` |
| `subCategoryId` | integer | — | Filter by sub-category |
| `subCategorySlug` | string | — | Filter by sub-category slug (e.g. `beds`) |
| `categoryId` | integer | — | Filter by parent category |
| `categorySlug` | string | — | Filter by parent category slug (e.g. `bedroom`) |
| `isActive` | boolean | `true` | Use `false` for hidden products |
| `tag` | string | — | CMS tag filter: `isBestSeller` \| `isFeaturedProduct` \| `isMostPopular` \| `isNewArrival` |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `sortBy` | string | `createdAt` | `name` \| `price` \| `createdAt` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

### Example requests

```http
GET /api/v1/products?subCategoryId=1
GET /api/v1/products?categoryId=1
GET /api/v1/products?categorySlug=bedroom&subCategorySlug=beds
GET /api/v1/products?name=oak&page=1&limit=10
GET /api/v1/products?tag=isFeaturedProduct
GET /api/v1/products?tag=isBestSeller&limit=8
GET /api/v1/products?minPrice=1000&maxPrice=50000&sortBy=price&sortOrder=asc
```

### List item fields

| Field | Description |
|-------|-------------|
| `subCategoryId` | Sub-category ID |
| `subCategory` | Nested sub-category + parent category |
| `productFeatures` | Array of feature strings (empty array if none) |
| `isBestSeller` / `isFeaturedProduct` / `isMostPopular` / `isNewArrival` | CMS merchandising flags |
| `primaryImage` | Lowest `sortOrder` image, or `null` |

### cURL

```bash
curl "http://localhost:5000/api/v1/products?categorySlug=bedroom&page=1&limit=10"
curl "http://localhost:5000/api/v1/products?tag=isFeaturedProduct&limit=10"
```

---

## Quick workflow

```bash
export TOKEN="<accessToken>"

# 1. Get sub-categories
curl http://localhost:5000/api/v1/sub-categories?categoryId=1 -H "Authorization: Bearer $TOKEN"

# 2. Create product
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Oak Table","slug":"oak-table","price":15000,"stock":5,"subCategoryId":1,"productFeatures":["Solid wood","Easy assembly"]}'

# 3. List products in Bedroom category (public — no token)
curl "http://localhost:5000/api/v1/products?categoryId=1"
```
