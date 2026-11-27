# Reviews API

Product ratings/reviews and overall order reviews for delivered purchases.

[← Back to index](./README.md) · [Customers](./customers.md) · [Orders](./orders.md) · [Products](./products.md) · [Admin reviews](./admin-reviews.md)

---

## Overview

- Customers may review **only after** an order is `DELIVERED`
- **Product review:** product must appear on that delivered order; one review per customer + product (create upserts)
- **Order review:** one review per order (create updates if already exists)
- Public storefront shows only customer reviews with `isVisible: true`
- Staff can list and hide/show reviews (`view-reviews`, `moderate-reviews`)
- **Admin-managed reviews** are a separate flow — see [admin-reviews.md](./admin-reviews.md). Product list/detail averages and `GET /products/:productId/reviews` **combine** visible customer product reviews + active admin reviews.

```mermaid
sequenceDiagram
    participant Customer
    participant API
    participant Staff

    Customer->>API: POST /reviews/products (orderId, productId, rating)
    API-->>Customer: upserted product review
    Customer->>API: POST /reviews/orders (orderId, rating)
    API-->>Customer: order review
    Staff->>API: PATCH /reviews/products/:id/visibility
    API-->>Staff: isVisible toggled
```

### Permissions

| Permission | Roles |
|------------|-------|
| `view-reviews` | SUPER_ADMIN, ADMIN, ORDER_MANAGER |
| `moderate-reviews` | SUPER_ADMIN, ADMIN |

---

## Endpoints

| Method | Endpoint | Auth | Access |
|--------|----------|------|--------|
| `POST` | `/api/v1/reviews/products` | Customer | Own delivered order item |
| `PATCH` | `/api/v1/reviews/products/:id` | Customer | Own review |
| `DELETE` | `/api/v1/reviews/products/:id` | Customer | Own review |
| `POST` | `/api/v1/reviews/orders` | Customer | Own delivered order |
| `PATCH` | `/api/v1/reviews/orders/:id` | Customer | Own review |
| `DELETE` | `/api/v1/reviews/orders/:id` | Customer | Own review |
| `GET` | `/api/v1/products/:productId/reviews` | Public | Visible reviews only |
| `GET` | `/api/v1/users/me/reviews` | Customer | Own product + order reviews |
| `GET` | `/api/v1/reviews` | Staff | `view-reviews` |
| `PATCH` | `/api/v1/reviews/products/:id/visibility` | Staff | `moderate-reviews` |
| `PATCH` | `/api/v1/reviews/orders/:id/visibility` | Staff | `moderate-reviews` |

---

## POST /api/v1/reviews/products

Create or update a product review for an item on a delivered order.

| | |
|---|---|
| **Auth** | Bearer (customer) |
| **Status** | `201` |

### Request body

```json
{
  "orderId": 12,
  "productId": 3,
  "rating": 5,
  "comment": "Solid build and looks great."
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `orderId` | integer | Yes | Must be owned and `DELIVERED` |
| `productId` | integer | Yes | Must be a line item on that order |
| `rating` | integer | Yes | `1`–`5` |
| `comment` | string | No | Max 2000 chars |

### Errors

| Status | When |
|--------|------|
| `404` | Order not found / not owned |
| `400` | Order not delivered, or product not on order |

---

## POST /api/v1/reviews/orders

Create or update an overall order review.

```json
{
  "orderId": 12,
  "rating": 4,
  "comment": "Delivery was on time."
}
```

---

## GET /api/v1/products/:productId/reviews

Public merged feed: visible customer product reviews + active admin-managed reviews, newest first.

Each item includes `source`: `"customer"` or `"admin"`. Meta `ratingAverage` / `reviewCount` use the **combined** pool.

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "source": "customer",
        "rating": 5,
        "comment": "Solid build and looks great.",
        "customer": { "id": 1, "phone": "******3210" },
        "createdAt": "2026-07-14T10:00:00.000Z",
        "updatedAt": "2026-07-14T10:00:00.000Z"
      },
      {
        "id": 2,
        "source": "admin",
        "rating": 5,
        "comment": "Beautiful craftsmanship and finish.",
        "displayName": "Anita Sharma",
        "location": "Mumbai",
        "images": [
          {
            "id": 1,
            "url": "https://cdn.example.com/admin-reviews/photo.webp",
            "altText": null,
            "sortOrder": 0
          }
        ],
        "createdAt": "2026-11-27T10:00:00.000Z",
        "updatedAt": "2026-11-27T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1,
      "ratingAverage": 5,
      "reviewCount": 2
    }
  }
}
```

Phone numbers are masked on customer items. Admin items use `displayName` / `location` and may include images.

---

## GET /api/v1/reviews (staff)

Query params: `kind` (`product` \| `order`, default `product`), `productId`, `orderId`, `customerId`, `isVisible`, `page`, `limit`.

---

## PATCH …/visibility (staff)

```json
{
  "isVisible": false
}
```

Hidden customer reviews are excluded from public product pages and combined `ratingAverage` / `reviewCount`. Inactive admin reviews are also excluded.

---

## Product list / detail enrichment

`GET /api/v1/products` (list items) and `GET /api/v1/products/:idOrSlug` include:

| Field | Type |
|-------|------|
| `ratingAverage` | number \| null |
| `reviewCount` | integer |

Values combine **visible customer product reviews** + **active admin-managed reviews**. See [admin-reviews.md](./admin-reviews.md).

Also see [customers.md](./customers.md) for `GET /users/me/reviews`.
