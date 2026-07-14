# Home Page CMS API

Public aggregated home payload (banners + CMS-tagged products) and admin APIs to manage banners and product CMS tags.

[← Back to index](./README.md) · [Products](./products.md) · [Uploads](./uploads.md)

---

## Overview

- **`GET /home`** — single cached storefront endpoint
- Returns **main banners**, **sub-banners**, and up to **8 products** for each CMS tag (`featuredProducts`, `bestSellers`, `mostPopular`, `newArrivals`)
- **Banners** — upload via [uploads.md](./uploads.md), then create/update with `imageUrl` + optional `imageStorageKey` and a `redirectUrl`
- **CMS tags** — assign on a product with `PATCH /admin/cms/products/:id/tags` (or full `PATCH /products/:id`)
- No hard delete for banners — set `isActive: false`

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /home` | **Public** | — | — | — |
| `POST /uploads/banner-images` | `create-banners` **or** `update-banners` | Yes | Yes | No |
| `POST /admin/home/banners` | `create-banners` | Yes | Yes | No |
| `GET /admin/home/banners` | `view-banners` | Yes | Yes | No |
| `GET /admin/home/banners/:id` | `view-banners` | Yes | Yes | No |
| `PATCH /admin/home/banners/:id` | `update-banners` | Yes | Yes | No |
| `PATCH /admin/cms/products/:id/tags` | `update-products` | Yes | Yes | No |

---

## GET /api/v1/home

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |
| **Cache** | Redis versioned body + `Cache-Control: public, max-age=0, s-maxage=60` |

### Success response

```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": 1,
        "title": "Summer Sale",
        "imageUrl": "https://cdn.example.com/banners/hero.webp",
        "redirectUrl": "/products?tag=isFeaturedProduct",
        "sortOrder": 0
      }
    ],
    "subBanners": [
      {
        "id": 2,
        "title": "New Collection",
        "imageUrl": "https://cdn.example.com/banners/sub.webp",
        "redirectUrl": "/categories/bedroom",
        "sortOrder": 0
      }
    ],
    "featuredProducts": [],
    "bestSellers": [],
    "mostPopular": [],
    "newArrivals": []
  }
}
```

Product arrays use the same list-item shape as `GET /products` (`primaryImage`, price string, CMS flags, subcategory summary). Each section returns at most **8** **active** products for that tag, newest first.

### cURL

```bash
curl "http://localhost:5000/api/v1/home"
```

---

## Banner uploads

1. `POST /api/v1/uploads/banner-images` with multipart `file`
2. Attach returned `url` / `key` when creating or updating a banner

```bash
curl -X POST http://localhost:5000/api/v1/uploads/banner-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/hero.jpg"
```

Stored keys look like `banners/{year}/{month}/{uuid}.webp`.

---

## Admin banners

### POST /api/v1/admin/home/banners

```json
{
  "type": "MAIN",
  "title": "Summer Sale",
  "imageUrl": "https://cdn.example.com/banners/hero.webp",
  "imageStorageKey": "banners/2026/07/uuid.webp",
  "redirectUrl": "/products?tag=isFeaturedProduct",
  "sortOrder": 0,
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | `MAIN` \| `SUB` | Yes | Main carousel vs sub/promo strip |
| `title` | string | No | Optional label |
| `imageUrl` | string (URL) | Yes | From banner upload |
| `imageStorageKey` | string | No | R2 key (`key` from upload) |
| `redirectUrl` | string | Yes | Relative path or absolute URL |
| `sortOrder` | integer | No | Default `0` (lower first) |
| `isActive` | boolean | No | Default `true` |

### GET /api/v1/admin/home/banners

| Param | Type | Description |
|-------|------|-------------|
| `type` | `MAIN` \| `SUB` | Filter by banner type |
| `isActive` | boolean | Filter by active status |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

### PATCH /api/v1/admin/home/banners/:id

Partial update. When `imageUrl` is replaced, pass the new `imageStorageKey`; the previous R2 object is deleted when the key changes. Hide with `{ "isActive": false }`.

---

## Assign CMS product tags

### PATCH /api/v1/admin/cms/products/:id/tags

Assign merchandising flags without a full product update. At least one field is required.

```json
{
  "isFeaturedProduct": true,
  "isBestSeller": false,
  "isMostPopular": true,
  "isNewArrival": false
}
```

| Field | Type |
|-------|------|
| `isBestSeller` | boolean |
| `isFeaturedProduct` | boolean |
| `isMostPopular` | boolean |
| `isNewArrival` | boolean |

### cURL

```bash
curl -X PATCH http://localhost:5000/api/v1/admin/cms/products/7/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isFeaturedProduct": true, "isNewArrival": true}'
```

Updating tags (or any product create/update) bumps the **products** and **home** cache versions so `GET /home` refreshes. Banner create/update bumps the home cache only.

You can still set the same flags via [products.md](./products.md) (`POST` / `PATCH /products`) or filter the catalogue with `GET /products?tag=isFeaturedProduct`.
