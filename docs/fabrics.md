# Fabrics API

Global fabric catalog for product fabric selection. Same pattern as [woods](./woods.md); independent of wood (a product can have woods, fabrics, both, or neither). **Product-specific price adjustments** live on the product assignment, not on the global catalog.

[← Back to index](./README.md) · [Woods](./woods.md) · [Products](./products.md) · [Cart](./cart.md) · [Orders](./orders.md)

---

## Overview

- Fabrics are a **global catalog** (`name`, `slug`, `color`, `isActive`) — no global price
- Products opt into fabrics via `fabrics: [{ fabricId, isActive?, priceAdjustment? }]` on create/update
- Per-product `isActive` can disable a fabric for one product without deleting the catalog entry
- Per-product `priceAdjustment` (default `0`) is added to the product base price when that fabric is selected
- No hard limit on how many fabrics exist or how many are assigned to a product
- Cart/checkout `fabricId` is optional; if sent, it must be an active fabric assigned to that product

### Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /fabrics` | `create-products` |
| `PATCH /fabrics/:id` | `update-products` |
| `GET /fabrics` | Public (no auth); defaults to `isActive=true` |
| `GET /fabrics/:id` | Public (no auth) |

Use `GET /fabrics` for admin catalog pickers. Product detail exposes per-product `fabrics` (with `priceAdjustment`) — that is what the storefront should use.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/fabrics` | Staff | `201` |
| `GET` | `/api/v1/fabrics` | Public | `200` |
| `GET` | `/api/v1/fabrics/:id` | Public | `200` |
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
    { "fabricId": 1, "isActive": true, "priceAdjustment": 1500 },
    { "fabricId": 2, "isActive": false, "priceAdjustment": 0 }
  ]
}
```

| Field | Rules |
|-------|-------|
| `fabrics[].fabricId` | Must exist in the fabric catalog |
| `fabrics[].isActive` | Optional; default `true` |
| `fabrics[].priceAdjustment` | Optional; min `0`; default `0` |

- Omitting `fabrics` leaves existing assignments unchanged (update) / none (create)
- Passing `[]` clears all product fabrics
- Product **detail** responses include all assigned fabrics with `isAvailable` and `priceAdjustment`
- Product **list** responses include only available fabrics (`isAvailable: true`)

Example detail fabric entry:

```json
{
  "id": 1,
  "name": "Linen Beige",
  "slug": "linen-beige",
  "color": "#D4C4A8",
  "isActive": true,
  "isAvailable": true,
  "priceAdjustment": "1500.00"
}
```

---

## Cart / order selection

| Situation | Rule |
|-----------|------|
| `fabricId` omitted | Always OK; fabric adj = `0` |
| `fabricId` provided and assigned + active for product | Accepted; uses that product's `priceAdjustment` |
| `fabricId` provided but not available for product | `400` |

**Unit price** = `Product.price + woodPriceAdjustment + polishPriceAdjustment + fabricPriceAdjustment`.

Order line items snapshot `fabricId` / `fabricName` / `fabricColor` / `fabricPriceAdjustment` when selected. See [cart.md](./cart.md) and [orders.md](./orders.md).
