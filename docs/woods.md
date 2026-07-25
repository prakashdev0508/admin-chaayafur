# Woods API

Global wood catalog for product wood selection (Sonic, Peak, Engineering, etc.).

[← Back to index](./README.md) · [Products](./products.md) · [Cart](./cart.md) · [Orders](./orders.md)

---

## Overview

- Woods are a **global catalog** (`name`, `slug`, `color`, `isActive`)
- Products opt into woods via `woods: [{ woodId, isActive }]` on create/update
- Per-product `isActive` can disable a wood for one product without deleting the catalog entry
- Seeded defaults: **Sonic**, **Peak**, **Engineering**
- When a product has ≥1 active wood, cart/checkout **requires** `woodId`

### Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /woods` | `create-products` |
| `PATCH /woods/:id` | `update-products` |
| `GET /woods` | `view-products` |
| `GET /woods/:id` | `view-products` |

Storefront reads woods from **product** payloads (`woods` array), not from this admin list.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/woods` | Staff | `201` |
| `GET` | `/api/v1/woods` | Staff | `200` |
| `GET` | `/api/v1/woods/:id` | Staff | `200` |
| `PATCH` | `/api/v1/woods/:id` | Staff | `200` |

---

## POST /api/v1/woods

```json
{
  "name": "Sonic",
  "slug": "sonic",
  "color": "#C4A574",
  "isActive": true
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique |
| `color` | string | Yes | Hex (`#C4A574`) or short label |
| `isActive` | boolean | No | Default `true` |

---

## GET /api/v1/woods

Query: `page`, `limit`, `isActive`, `name` (partial).

---

## PATCH /api/v1/woods/:id

Partial update. Set `isActive: false` to hide a wood globally (products that still reference it will not expose it as selectable while the wood is inactive).

---

## Product assignment

On `POST /products` or `PATCH /products/:id`:

```json
{
  "woods": [
    { "woodId": 1, "isActive": true },
    { "woodId": 2, "isActive": false }
  ]
}
```

- Omitting `woods` leaves existing assignments unchanged (update) / none (create)
- Passing `[]` clears all product woods
- Product **detail** responses include all assigned woods with `isAvailable` (`true` only when both the product assignment and the global wood are active). Use `isAvailable: false` on the storefront to show “we offer this wood but it’s currently unavailable.”
- Product **list** responses include only available woods (`isAvailable: true`)

Example detail wood entry:

```json
{
  "id": 1,
  "name": "Sonic",
  "slug": "sonic",
  "color": "#C4A574",
  "isActive": false,
  "isAvailable": false
}
```

---

## Cart / order selection

| Situation | Rule |
|-----------|------|
| Product has active woods | `woodId` **required**; must be one of those woods |
| Product has no active woods | `woodId` must be omitted |

Order line items store `woodId` plus snapshots `woodName` / `woodColor`.
