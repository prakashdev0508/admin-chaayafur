# Admin-Managed Reviews API

Staff-authored product reviews/testimonials (with images), separate from customer post-delivery reviews.

[← Back to index](./README.md) · [Reviews](./reviews.md) · [Uploads](./uploads.md) · [Home](./home.md) · [Products](./products.md)

---

## Overview

- Completely **separate** from customer `Review` / `OrderReview` (no shared create/update paths)
- Admin links a review to **one product**, with persona fields (`displayName`, optional `location`)
- Optional **images** (upload via [uploads.md](./uploads.md), then attach `url` + `storageKey`)
- **`showOnHome`** — when `true` and `isActive`, appears in `GET /home` as `featuredReviews`
- **`sortOrder`** auto-assigns to `max+1` on create when omitted
- Hide with `isActive: false`, or permanently remove with `DELETE`
- Storefront **averages and review lists** combine active admin reviews + visible customer product reviews

### Admin addition flow

```text
1. POST /uploads/admin-review-images  →  { url, key }  (optional, repeat)
2. POST /admin/reviews                →  review (productId + displayName + rating + images?)
```

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /uploads/admin-review-images` | `create-admin-reviews` **or** `update-admin-reviews` | Yes | Yes | No |
| `POST /admin/reviews` | `create-admin-reviews` | Yes | Yes | No |
| `GET /admin/reviews` | `view-admin-reviews` | Yes | Yes | No |
| `GET /admin/reviews/:id` | `view-admin-reviews` | Yes | Yes | No |
| `PATCH /admin/reviews/:id` | `update-admin-reviews` | Yes | Yes | No |
| `DELETE /admin/reviews/:id` | `delete-admin-reviews` | Yes | Yes | No |

`SUPER_ADMIN` has `all`. `ADMIN` is seeded with the four `*-admin-reviews` permissions.

---

## Endpoints

| Method | Endpoint | Auth | Access |
|--------|----------|------|--------|
| `POST` | `/api/v1/uploads/admin-review-images` | Staff | `create-admin-reviews` or `update-admin-reviews` |
| `POST` | `/api/v1/admin/reviews` | Staff | `create-admin-reviews` |
| `GET` | `/api/v1/admin/reviews` | Staff | `view-admin-reviews` |
| `GET` | `/api/v1/admin/reviews/:id` | Staff | `view-admin-reviews` |
| `PATCH` | `/api/v1/admin/reviews/:id` | Staff | `update-admin-reviews` |
| `DELETE` | `/api/v1/admin/reviews/:id` | Staff | `delete-admin-reviews` |

Public surfaces (combined with customer reviews where noted):

| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/v1/home` | `featuredReviews` = active + `showOnHome` |
| `GET` | `/api/v1/products` | `ratingAverage` / `reviewCount` include admin + customer |
| `GET` | `/api/v1/products/:idOrSlug` | same combined stats |
| `GET` | `/api/v1/products/:productId/reviews` | merged feed with `source: "admin" \| "customer"` |

---

## POST /api/v1/admin/reviews

| | |
|---|---|
| **Auth** | Bearer (staff) — `create-admin-reviews` |
| **Status** | `201` |

### Request body

```json
{
  "productId": 3,
  "displayName": "Anita Sharma",
  "location": "Mumbai",
  "rating": 5,
  "comment": "Beautiful craftsmanship and finish.",
  "showOnHome": true,
  "isActive": true,
  "images": [
    {
      "url": "https://cdn.example.com/admin-reviews/photo.webp",
      "storageKey": "admin-reviews/2026/11/uuid.webp",
      "altText": "Living room setup",
      "sortOrder": 0
    }
  ]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `productId` | integer | Yes | Must exist |
| `displayName` | string | Yes | Max 120 chars |
| `location` | string | No | Max 100 chars |
| `rating` | integer | Yes | `1`–`5` |
| `comment` | string | No | Max 2000 chars |
| `showOnHome` | boolean | No | Default `false` |
| `sortOrder` | integer | No | Auto `max+1` when omitted |
| `isActive` | boolean | No | Default `true` |
| `images` | array | No | Max 10; each needs `url` |

### Errors

| Status | When |
|--------|------|
| `404` | Product not found |
| `400` | Validation failure |

---

## GET /api/v1/admin/reviews

Query params: `productId`, `showOnHome`, `isActive`, `page`, `limit`.

Ordered by `sortOrder ASC`, then `id DESC`.

---

## PATCH /api/v1/admin/reviews/:id

Partial update. When `images` is sent, it **replaces** the full image set (removed R2 keys are deleted).

---

## DELETE /api/v1/admin/reviews/:id

| | |
|---|---|
| **Status** | `204` |

Permanently deletes the review, image rows, and R2 objects.

---

## Storefront shapes

### Home `featuredReviews` item

```json
{
  "id": 1,
  "source": "admin",
  "productId": 3,
  "displayName": "Anita Sharma",
  "location": "Mumbai",
  "rating": 5,
  "comment": "Beautiful craftsmanship and finish.",
  "sortOrder": 0,
  "product": { "id": 3, "name": "Oak Dining Table", "slug": "oak-dining-table" },
  "images": [
    { "id": 1, "url": "https://cdn.example.com/admin-reviews/photo.webp", "altText": "Living room setup", "sortOrder": 0 }
  ],
  "createdAt": "2026-11-27T10:00:00.000Z",
  "updatedAt": "2026-11-27T10:00:00.000Z"
}
```

### PDP merged review (`GET /products/:productId/reviews`)

Admin item:

```json
{
  "id": 1,
  "source": "admin",
  "rating": 5,
  "comment": "Beautiful craftsmanship and finish.",
  "displayName": "Anita Sharma",
  "location": "Mumbai",
  "images": [{ "id": 1, "url": "https://cdn.example.com/admin-reviews/photo.webp", "altText": null, "sortOrder": 0 }],
  "createdAt": "2026-11-27T10:00:00.000Z",
  "updatedAt": "2026-11-27T10:00:00.000Z"
}
```

Customer item keeps masked phone and `source: "customer"` (no images). Meta `ratingAverage` / `reviewCount` use the combined pool.

---

## cURL

```bash
export TOKEN="<staffAccessToken>"

# 1. Upload image
curl -X POST http://localhost:5000/api/v1/uploads/admin-review-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@review.jpg"

# 2. Create review
curl -X POST http://localhost:5000/api/v1/admin/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 3,
    "displayName": "Anita Sharma",
    "location": "Mumbai",
    "rating": 5,
    "comment": "Beautiful craftsmanship and finish.",
    "showOnHome": true,
    "images": [{ "url": "https://cdn.example.com/admin-reviews/photo.webp", "storageKey": "admin-reviews/2026/11/uuid.webp" }]
  }'
```
