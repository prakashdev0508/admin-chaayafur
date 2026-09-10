# Instagram Feed API

Admin selection of Instagram posts to feature on the storefront, and a public endpoint that returns live Graph API media details for those selections — including an optional **linked product** (same shape as `GET /products` list items) for storefront redirects.

[← Back to index](./README.md) · [Products](./products.md)

---

## Overview

- Instagram media is **not** stored in our database — only selected media **IDs**, optional **product link**, and sort order
- Admin browses the connected Instagram account via Graph API (`/me/media`)
- Admin saves an ordered list with optional `productId` via `PUT /admin/instagram/selections`
- Public `GET /instagram` live-fetches each post from Graph API and embeds the linked product (list shape) when present and active
- Storefront can use `product.slug` / `product.id` to redirect (e.g. video tap → product page)
- Requires `INSTA_ACCESS_TOKEN` in the environment (Instagram User long-lived token)

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /instagram` | **Public** | — | — | — |
| `GET /admin/instagram/media` | `view-instagram` | Yes | Yes | No |
| `GET /admin/instagram/selections` | `view-instagram` | Yes | Yes | No |
| `PUT /admin/instagram/selections` | `update-instagram` | Yes | Yes | No |

---

## Environment

```env
INSTA_ACCESS_TOKEN=IGQWxxxxx...
```

Rotate the token manually when Meta expires it. Without a token, Instagram endpoints return `503`.

---

## GET /api/v1/instagram

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |
| **Cache** | `Cache-Control: public, max-age=0, s-maxage=60` |

Returns only posts that admins have selected, in `sortOrder` ascending. Deleted or unreachable Instagram media is omitted. Linked products use the **same fields as `GET /products` list items**. Inactive or missing products yield `product: null` and `productId: null`.

### Success response

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "18406903111093175",
        "media_type": "VIDEO",
        "media_url": "https://scontent.cdninstagram.com/...",
        "thumbnail_url": "https://scontent.cdninstagram.com/...",
        "permalink": "https://www.instagram.com/reel/DdDrsRChSOZ/",
        "caption": "From the hands of Indian artisans...",
        "timestamp": "2024-02-09T07:07:57+0000",
        "like_count": 38,
        "comments_count": 4,
        "productId": 12,
        "product": {
          "id": 12,
          "name": "Oak Dining Chair",
          "slug": "oak-dining-chair",
          "price": "12999.00",
          "priceWithoutDiscount": "14999.00",
          "stock": 8,
          "isActive": true,
          "isBestSeller": false,
          "isFeaturedProduct": true,
          "isMostPopular": false,
          "isNewArrival": false,
          "hsnCode": null,
          "warrantyMonths": 12,
          "productFeatures": [],
          "customization": [],
          "woods": [],
          "fabrics": [],
          "polishes": [],
          "categoryIds": [1],
          "categories": [{ "id": 1, "name": "Dining", "slug": "dining" }],
          "subCategoryIds": [6],
          "subCategories": [{ "id": 6, "name": "Chairs", "slug": "chairs" }],
          "subCategoryId": 6,
          "subCategory": { "id": 6, "name": "Chairs", "slug": "chairs" },
          "primaryImage": { "url": "https://cdn.example.com/p.webp", "altText": null },
          "secondaryImage": null,
          "createdAt": "2026-01-15T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

## GET /api/v1/admin/instagram/media

| | |
|---|---|
| **Auth** | Bearer staff JWT + `view-instagram` |
| **Status** | `200` |

Proxies Instagram Graph API `/me/media` (up to 3 pages × 100). Each item includes `isSelected` and `productId` from the current DB selections.

### Success response

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "18406903111093175",
        "media_type": "VIDEO",
        "media_url": "https://scontent.cdninstagram.com/...",
        "thumbnail_url": "https://scontent.cdninstagram.com/...",
        "permalink": "https://www.instagram.com/reel/DdDrsRChSOZ/",
        "caption": "From the hands of Indian artisans...",
        "timestamp": "2024-02-09T07:07:57+0000",
        "like_count": 38,
        "comments_count": 4,
        "isSelected": true,
        "productId": 12
      }
    ]
  }
}
```

---

## GET /api/v1/admin/instagram/selections

| | |
|---|---|
| **Auth** | Bearer staff JWT + `view-instagram` |
| **Status** | `200` |

Returns stored selections ordered by `sortOrder`, each with optional list-shaped `product` (includes inactive products for admin).

### Success response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "instagramMediaId": "18406903111093175",
      "productId": 12,
      "sortOrder": 0,
      "isActive": true,
      "createdAt": "2026-09-10T00:00:00.000Z",
      "updatedAt": "2026-09-10T00:00:00.000Z",
      "product": {
        "id": 12,
        "name": "Oak Dining Chair",
        "slug": "oak-dining-chair",
        "price": "12999.00"
      }
    }
  ]
}
```

(`product` uses the full list-item shape; truncated above for brevity.)

---

## PUT /api/v1/admin/instagram/selections

| | |
|---|---|
| **Auth** | Bearer staff JWT + `update-instagram` |
| **Status** | `200` |

Replaces the full featured set. Array order becomes `sortOrder` (index `0` first). Media IDs not in the body are removed. An empty `items` array clears all selections.

### Request body

```json
{
  "items": [
    { "mediaId": "18406903111093175", "productId": 12 },
    { "mediaId": "17923456789012345", "productId": null }
  ]
}
```

| Field | Rules |
|-------|--------|
| `items` | Required array; max 50 |
| `items[].mediaId` | Required string; must be unique within the array |
| `items[].productId` | Optional positive int or `null` to clear the product link. Omitted on update keeps the existing link for that media ID. Unknown product IDs → `400` |

### Success response

Same shape as `GET /admin/instagram/selections` for the new set.

### Typical admin flow

1. `GET /admin/instagram/media` — browse account posts; check `isSelected` / `productId`
2. Choose posts in display order and optionally attach a product ID to each
3. `PUT /admin/instagram/selections` with `{ "items": [{ "mediaId", "productId" }, ...] }`
4. Storefront calls `GET /instagram` and redirects (e.g. video CTA) to `/products/{slug}` using `product`
