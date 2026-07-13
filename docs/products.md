# Products API

Create, update, and list furniture products.

[← Back to index](./README.md) · [Categories docs](./categories.md) · [Auth docs](./auth.md) · [Orders / checkout](./orders.md)

---

## Overview

- **No delete endpoint** — use `isActive: false` to soft-hide products
- **Images are URL-based** — upload to CDN first, pass URLs in payload (max 10 per product)
- **`productFeatures`** — optional array of feature strings (e.g. `"Solid oak wood"`, `"1-year warranty"`) for product detail bullets; max 50 items, 200 chars each
- Default list shows only **active** products (`isActive=true`)
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
| `PATCH /products/:id` | `update-products` | Yes | Yes | No |
| `GET /products` | **Public** | — | — | — |

---

## Endpoints

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `POST` | `/api/v1/products` | `create-products` | `201` |
| `PATCH` | `/api/v1/products/:id` | `update-products` | `200` |
| `GET` | `/api/v1/products` | **Public** | `200` |

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
  "stock": 10,
  "subCategoryId": 1,
  "isActive": true,
  "productFeatures": [
    "Solid oak wood",
    "Seats 6 people",
    "1-year warranty"
  ],
  "images": [
    {
      "url": "https://cdn.example.com/products/oak-table.jpg",
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
| `price` | number | Yes | Min `0` |
| `stock` | number | Yes | Min `0` |
| `subCategoryId` | integer | Yes | Must exist in `SubCategory` table |
| `isActive` | boolean | No | Default `true` |
| `productFeatures` | string[] | No | Max 50 items; each string max 200 chars. Default `[]` |
| `images` | array | No | Max 10 items |

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
    "stock": 10,
    "isActive": true,
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
        "altText": "Oak dining table front view",
        "sortOrder": 0
      }
    ],
    "createdAt": "2026-07-09T18:02:58.000Z",
    "updatedAt": "2026-07-09T18:02:58.000Z"
  }
}
```

> `price` is returned as a **string** for decimal precision.

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

## PATCH /api/v1/products/:id

Partial update. All body fields are optional.

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | — |
| `slug` | string | Unique across all products |
| `description` | string | — |
| `price` | number | Min `0` |
| `stock` | number | Min `0` |
| `subCategoryId` | integer | Must exist in `SubCategory` table |
| `isActive` | boolean | Set `false` to hide product |
| `productFeatures` | string[] | Replace entire list. Pass `[]` to clear all features |
| `images` | array | Replaces all images when provided (max 10) |

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
| `categoryId` | integer | — | Filter by parent category |
| `isActive` | boolean | `true` | Use `false` for hidden products |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `sortBy` | string | `createdAt` | `name` \| `price` \| `createdAt` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

### Example requests

```http
GET /api/v1/products?subCategoryId=1
GET /api/v1/products?categoryId=1
GET /api/v1/products?name=oak&page=1&limit=10
```

### List item fields

| Field | Description |
|-------|-------------|
| `subCategoryId` | Sub-category ID |
| `subCategory` | Nested sub-category + parent category |
| `productFeatures` | Array of feature strings (empty array if none) |
| `primaryImage` | Lowest `sortOrder` image, or `null` |

### cURL

```bash
curl "http://localhost:5000/api/v1/products?categoryId=1&page=1&limit=10"
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
