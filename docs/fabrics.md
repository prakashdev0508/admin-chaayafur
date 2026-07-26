# Fabrics API

Global fabric catalog for product fabric selection. Same pattern as [woods](./woods.md); independent of wood (a product can have woods, fabrics, both, or neither).

[← Back to index](./README.md) · [Woods](./woods.md) · [Products](./products.md) · [Cart](./cart.md) · [Orders](./orders.md)

---

## Overview

- Fabrics are a **global catalog** (`name`, `slug`, `color`, `isActive`)
- Products opt into fabrics via `fabrics: [{ fabricId, isActive }]` on create/update
- Per-product `isActive` can disable a fabric for one product without deleting the catalog entry
- No hard limit on how many fabrics exist or how many are assigned to a product
- Cart/checkout does **not** require `fabricId` yet (catalog + product assignment only in this phase)

### Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /fabrics` | `create-products` |
| `PATCH /fabrics/:id` | `update-products` |
| `GET /fabrics` | `view-products` |
| `GET /fabrics/:id` | `view-products` |

Storefront reads fabrics from **product** payloads (`fabrics` array), not from this admin list.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/fabrics` | Staff | `201` |
| `GET` | `/api/v1/fabrics` | Staff | `200` |
| `GET` | `/api/v1/fabrics/:id` | Staff | `200` |
| `PATCH` | `/api/v1/fabrics/:id` | Staff | `200` |

---

## POST /api/v1/fabrics

```json
{
  "name": "Linen Beige",
  "slug": "linen-beige",
  "color": "#D4C4A8",
  "isActive": true
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique |
| `color` | string | Yes | Hex (`#D4C4A8`) or short label |
| `isActive` | boolean | No | Default `true` |

---

## GET /api/v1/fabrics

Query: `page`, `limit`, `isActive`, `name` (partial).

---

## PATCH /api/v1/fabrics/:id

Partial update. Set `isActive: false` to hide a fabric globally.

---

## Product assignment

On `POST /products` or `PATCH /products/:id`:

```json
{
  "fabrics": [
    { "fabricId": 1, "isActive": true },
    { "fabricId": 2, "isActive": false }
  ]
}
```

- Omitting `fabrics` leaves existing assignments unchanged (update) / none (create)
- Passing `[]` clears all product fabrics
- Product **detail** responses include all assigned fabrics with `isAvailable` (`true` only when both the product assignment and the global fabric are active)
- Product **list** responses include only available fabrics (`isAvailable: true`)

Example detail fabric entry:

```json
{
  "id": 1,
  "name": "Linen Beige",
  "slug": "linen-beige",
  "color": "#D4C4A8",
  "isActive": true,
  "isAvailable": true
}
```
