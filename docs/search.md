# Search API

Global search for the storefront (public) and admin panel.

[← Back to index](./README.md) · [Products](./products.md) · [Categories](./categories.md) · [Orders](./orders.md)

---

## Overview

- Backed by **PostgreSQL full-text search** (`tsvector` + GIN) and **trigram indexes** (`pg_trgm`) — no third-party search engine
- Unified hit shape includes `type`, `id`, and `slug` (when applicable) so clients can build redirect links
- Public search is **cached** (Redis / in-memory) and returns CDN `Cache-Control` headers
- Admin search is **not cached** (PII + freshness) and filters entity types by the caller’s `view-*` permissions

### Who can access?

| Endpoint | Auth |
|----------|------|
| `GET /search` | **Public** |
| `GET /admin/search` | Staff Bearer — any of: `view-products`, `view-categories`, `view-orders`, `view-customers`, `view-coupons`, `view-order-support`, `view-payments` |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/search` | Public | `200` |
| `GET` | `/api/v1/admin/search` | Staff | `200` |

---

## GET /api/v1/search

Public catalog search across **active** products, categories, and subcategories.

### Query parameters

| Param | Required | Default | Notes |
|-------|:--------:|---------|-------|
| `q` | Yes | — | Trimmed; min 2, max 100 characters |
| `limit` | No | `20` | Max `50` |

### Match fields

| Type | Fields |
|------|--------|
| `product` | name, slug, description, product features, category/subcategory name |
| `category` | name, slug, description |
| `subcategory` | name, slug, heading, description, parent category name |

Only rows with `isActive = true` (and active parent chain for products / subcategories) are returned.

```bash
curl "http://localhost:5000/api/v1/search?q=oak&limit=10"
```

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "product",
        "id": 12,
        "slug": "oak-dining-table",
        "title": "Oak Dining Table",
        "subtitle": "Dining · Dining Tables",
        "imageUrl": "https://cdn.example.com/products/oak.webp",
        "rank": 0.82,
        "status": "ACTIVE"
      },
      {
        "type": "category",
        "id": 3,
        "slug": "dining",
        "title": "Dining",
        "subtitle": "Dining room furniture",
        "imageUrl": "https://cdn.example.com/categories/dining.webp",
        "rank": 0.41,
        "status": "ACTIVE"
      }
    ],
    "query": "oak"
  }
}
```

Response headers include:

```http
Cache-Control: public, max-age=30, s-maxage=60
```

### Building links (storefront)

| `type` | Suggested path |
|--------|----------------|
| `product` | `/products/{slug}` or `/products/{id}` |
| `category` | `/categories/{slug}` |
| `subcategory` | `/sub-categories/{slug}` (or category + subcategory slug) |

---

## GET /api/v1/admin/search

Staff global search across catalog and operational entities.

### Query parameters

| Param | Required | Default | Notes |
|-------|:--------:|---------|-------|
| `q` | Yes | — | Trimmed; min 2, max 100 |
| `limit` | No | `20` | Max `50` |
| `types` | No | all allowed | CSV or repeated values — see types below |

### Entity types

| `type` | Permission | Match fields | Link helpers |
|--------|------------|--------------|--------------|
| `product` | `view-products` | name, slug, description, features, category names; numeric `id` | `id`, `slug` |
| `category` | `view-categories` | name, slug, description; numeric `id` | `id`, `slug` |
| `subcategory` | `view-categories` | name, slug, heading, description; numeric `id` | `id`, `slug` |
| `order` | `view-orders` | `orderNumber`, numeric `id` | `id`, `orderNumber`, `status`, `phone` |
| `invoice` | `view-orders` | `invoiceNumber`, related order number, numeric `id` | `id`, `orderId`, `orderNumber` |
| `customer` | `view-customers` | phone, numeric `id` | `id`, `phone` |
| `coupon` | `view-coupons` | code, description | `id`, `title` (code) |
| `support_ticket` | `view-order-support` | ticket number, subject, numeric `id` | `id`, `orderId`, `status` |
| `payment` | `view-payments` | transaction / Razorpay IDs, related order number, numeric `id` | `id`, `orderId`, `status` |

Results are limited to types the staff user is allowed to view. Requested `types` outside that set are ignored. Inactive catalog rows are included for admin (marked in `subtitle` / `status`).

```bash
curl "http://localhost:5000/api/v1/admin/search?q=ORD-202607&types=order,invoice,customer" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "order",
        "id": 42,
        "slug": null,
        "title": "ORD-20260716-0001",
        "subtitle": "CONFIRMED · +919876543210",
        "imageUrl": null,
        "rank": 0.95,
        "status": "CONFIRMED",
        "orderId": 42,
        "orderNumber": "ORD-20260716-0001",
        "phone": "+919876543210"
      },
      {
        "type": "customer",
        "id": 10,
        "slug": null,
        "title": "+919876543210",
        "subtitle": "Customer",
        "imageUrl": null,
        "rank": 0.7,
        "status": "ACTIVE",
        "phone": "+919876543210"
      }
    ],
    "query": "ORD-202607"
  }
}
```

### Building links (admin)

| `type` | Suggested path |
|--------|----------------|
| `product` | `/admin/products/{id}` |
| `category` | `/admin/categories/{id}` |
| `subcategory` | `/admin/sub-categories/{id}` |
| `order` | `/admin/orders/{id}` |
| `invoice` | `/admin/orders/{orderId}/invoice` |
| `customer` | `/admin/customers/{id}` |
| `coupon` | `/admin/coupons/{id}` |
| `support_ticket` | `/admin/order-support/{id}` |
| `payment` | `/admin/payments/{id}` |

---

## Errors

| Status | When |
|--------|------|
| `400` | Missing `q`, `q` shorter than 2 chars, invalid `limit` / `types` |
| `401` | Admin search without Bearer token |
| `403` | Staff token without any of the required `view-*` permissions |
