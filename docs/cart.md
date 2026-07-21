# Cart API

Persistent server-side cart for logged-in customers. Only `productId` and `quantity` are stored; **all prices are computed from live product data** on every read and at checkout.

[← Back to index](./README.md) · [Customers](./customers.md) · [Orders](./orders.md) · [Coupons](./coupons.md) · [Products](./products.md)

---

## Overview

| Audience | Cart storage |
|----------|----------------|
| Guest (no JWT) | Frontend `localStorage` — not synced to the API |
| Logged-in customer | `GET/POST/PATCH/DELETE /api/v1/cart` — one cart per customer |
| Staff | `GET/POST /api/v1/carts` — list, detail, seed/add items for any customer |

- **No prices in the database** on cart rows — `unitPrice`, `lineTotal`, and `subtotalAmount` are derived from `Product.price` when you fetch the cart.
- **Stock and availability** are checked when adding/updating lines and again at checkout.
- **Coupons** are not stored on the cart; pass `couponCode` on `POST /orders` at checkout (see [orders.md](./orders.md)).
- After a **successful** checkout with `useCart: true`, cart lines are cleared automatically.

### Typical flow

```text
Login (OTP) → POST /cart/items (add products) → GET /cart (review totals)
→ POST /coupons/validate (optional) → POST /orders { useCart: true, ... } → Razorpay
```

---

## Who can access?

| Endpoint | Customer JWT | Staff |
|----------|:------------:|:-----:|
| `GET /cart` | Yes | No |
| `POST /cart/items` | Yes | No |
| `PATCH /cart/items/:productId` | Yes | No |
| `DELETE /cart/items/:productId` | Yes | No |
| `GET /carts` | No | `view-customers` |
| `GET /carts/:cartId` | No | `view-customers` |
| `POST /carts` | No | `update-customers` |
| `POST /carts/:cartId/items` | No | `update-customers` |
| `PATCH /carts/:cartId/items/:productId` | No | `update-customers` |
| `DELETE /carts/:cartId/items/:productId` | No | `update-customers` |

Customer routes require `@CustomerOnly()`. Staff routes use permissions above (ORDER_MANAGER can view; only ADMIN / SUPER_ADMIN can mutate).

---

## Endpoints

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/cart` | `200` | Cart lines + computed totals |
| `POST` | `/api/v1/cart/items` | `200` | Upsert line by `productId` |
| `PATCH` | `/api/v1/cart/items/:productId` | `200` | Set quantity for one product |
| `DELETE` | `/api/v1/cart/items/:productId` | `200` | Remove one product |

---

## GET /api/v1/cart

Returns the current cart with server-computed pricing.

### Success response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": "24999.99",
        "lineTotal": "49999.98",
        "name": "Oak Dining Table",
        "slug": "oak-dining-table",
        "stock": 5,
        "imageUrl": "https://cdn.example.com/products/1.jpg",
        "isAvailable": true
      }
    ],
    "itemCount": 2,
    "subtotalAmount": "49999.98"
  }
}
```

| Field | Description |
|-------|-------------|
| `unitPrice` | Current `Product.price` (string, 2 decimals) |
| `lineTotal` | `unitPrice × quantity` |
| `isAvailable` | `false` if product inactive or `stock < quantity` |
| `itemCount` | Sum of line quantities |
| `subtotalAmount` | Sum of line totals |

Empty cart:

```json
{
  "success": true,
  "data": {
    "items": [],
    "itemCount": 0,
    "subtotalAmount": "0.00"
  }
}
```

### cURL

```bash
curl "http://localhost:5000/api/v1/cart" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## POST /api/v1/cart/items

Add a product or replace quantity if the line already exists (upsert).

### Request body

```json
{
  "productId": 1,
  "quantity": 2
}
```

| Field | Rules |
|-------|-------|
| `productId` | Integer ≥ 1, must exist |
| `quantity` | Integer ≥ 1, max per app validation constant |

### Validation

- Product must exist and `isActive: true`
- `quantity` must not exceed current `stock`

### Response

Same shape as `GET /cart` (full cart after the change).

```bash
curl -X POST "http://localhost:5000/api/v1/cart/items" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'
```

---

## PATCH /api/v1/cart/items/:productId

Set quantity for an existing line.

### Request body

```json
{
  "quantity": 3
}
```

Returns `404` if the product is not in the cart.

---

## DELETE /api/v1/cart/items/:productId

Remove a line. Returns `404` if not present.

---

## Checkout with saved cart

Use `POST /api/v1/orders` with `useCart: true`. The `items` array in the body is **ignored**.

```json
{
  "useCart": true,
  "shippingAddressId": 1,
  "billingAddressId": 2,
  "couponCode": "SAVE500"
}
```

- Line items and subtotal are built from the server cart at checkout time (same pricing rules as `GET /cart`).
- Cart is cleared only after the order and Razorpay payment link are created successfully.
- If payment-link creation fails, checkout is compensated (stock/coupon restored) and the **cart is left unchanged**.

See [orders.md](./orders.md) for full checkout and payment flow.

---

## Legacy / guest checkout

Guests and older clients can still send `items: [{ productId, quantity }]` on `POST /orders` without `useCart`. Only `productId` and `quantity` are trusted; prices are always taken from the database.

---

## Error cases

| Scenario | Status | Message (typical) |
|----------|--------|-------------------|
| Not logged in as customer | `401` / `403` | Unauthorized / Customer access required |
| Product not found | `404` | Product not found |
| Inactive product | `400` | Product … is not available |
| Insufficient stock | `400` | Insufficient stock for product … |
| Cart line missing (PATCH/DELETE) | `404` | Cart item not found |
| Empty cart at checkout | `400` | Cart is empty |

---

## Data model (reference)

- One `Cart` row per `customerId` (created on first add).
- `CartItem` rows: unique `(cartId, productId)`, `quantity` only — no stored price.

---

## Admin — Carts API

Staff can list all carts, inspect priced line items, and add/update/remove products for a customer. Staff cart mutations write **audit logs** (`CART_ITEM`) with who changed quantity and when — visible on `GET /customers/:id/audit-logs`.

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `GET` | `/api/v1/carts` | `view-customers` | `200` |
| `GET` | `/api/v1/carts/:cartId` | `view-customers` | `200` |
| `POST` | `/api/v1/carts` | `update-customers` | `200` |
| `POST` | `/api/v1/carts/:cartId/items` | `update-customers` | `200` |
| `PATCH` | `/api/v1/carts/:cartId/items/:productId` | `update-customers` | `200` |
| `DELETE` | `/api/v1/carts/:cartId/items/:productId` | `update-customers` | `200` |

### GET /api/v1/carts

Paginated list.

| Param | Description |
|-------|-------------|
| `page` / `limit` | Pagination |
| `customerId` | Exact customer id |
| `customerPhone` | Partial phone match |
| `hasItems` | `true` = only non-empty carts; `false` = empty only |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 3,
        "customerId": 5,
        "customerPhone": "9876543210",
        "itemCount": 2,
        "lineCount": 1,
        "subtotalAmount": "49999.98",
        "updatedAt": "2026-07-21T12:00:00.000Z",
        "createdAt": "2026-07-20T10:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

### GET /api/v1/carts/:cartId

Full cart detail (same priced `items` as customer `GET /cart`) plus customer summary.

```json
{
  "success": true,
  "data": {
    "id": 3,
    "customerId": 5,
    "customer": { "id": 5, "phone": "9876543210" },
    "items": [],
    "itemCount": 0,
    "subtotalAmount": "0.00",
    "createdAt": "2026-07-20T10:00:00.000Z",
    "updatedAt": "2026-07-21T12:00:00.000Z"
  }
}
```

### POST /api/v1/carts

Get-or-create the customer's cart, then upsert a line (use when the customer has no cart yet).

```json
{
  "customerId": 5,
  "productId": 1,
  "quantity": 2
}
```

Returns the same shape as `GET /carts/:cartId`.

### POST /api/v1/carts/:cartId/items

Upsert a line on an **existing** cart (`404` if cart id unknown).

```json
{
  "productId": 1,
  "quantity": 2
}
```

### PATCH /api/v1/carts/:cartId/items/:productId

Set absolute quantity for an existing line (`404` if cart or product line missing).

```json
{
  "quantity": 5
}
```

### DELETE /api/v1/carts/:cartId/items/:productId

Remove a product line from the cart.

### Audit logging

Staff add / update / remove cart lines write `AdminAuditLog` rows:

| Field | Value |
|-------|-------|
| `entityType` | `CART_ITEM` |
| `entityId` | `productId` |
| `parentEntityId` | `customerId` |
| `fieldName` | `quantity` |
| `oldValue` / `newValue` | previous / new quantity (`null` when removed) |
| `changedBy` | staff user |
| `createdAt` | when the change happened |

Shown on `GET /api/v1/customers/:id/audit-logs` and filterable via `GET /api/v1/audit-logs?entityType=CART_ITEM`.
