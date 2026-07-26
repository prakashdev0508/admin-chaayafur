# Woods API

Global wood catalog for product wood selection (Sonic, Peak, Engineering, etc.), with optional polish options nested under each wood.

[← Back to index](./README.md) · [Fabrics](./fabrics.md) · [Products](./products.md) · [Cart](./cart.md) · [Orders](./orders.md)

---

## Overview

- Woods are a **global catalog** (`name`, `slug`, `color`, `isActive`)
- Each wood can have nested **polishes** (`name`, `slug`, `color`, `isActive`) unique per wood (`woodId` + `slug`)
- Products opt into woods via `woods: [{ woodId, isActive }]` on create/update
- Per-product `isActive` can disable a wood for one product without deleting the catalog entry
- Seeded defaults: **Sonic**, **Peak**, **Engineering**
- Cart/checkout `woodId` is an **optional customization** — omit freely; if sent, it must be an active wood assigned to that product

### Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /woods` | `create-products` |
| `PATCH /woods/:id` | `update-products` |
| `GET /woods` | `view-products` |
| `GET /woods/:id` | `view-products` |

Storefront reads woods (with polishes) from **product** payloads (`woods` array), not from this admin list.

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
  "name": "CSUM",
  "slug": "csum",
  "color": "#C4A574",
  "isActive": true,
  "polishes": [
    { "name": "Matte", "slug": "matte", "color": "#E8E8E8", "isActive": true },
    { "name": "Gloss", "slug": "gloss", "color": "#FFFFFF", "isActive": true }
  ]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique |
| `color` | string | Yes | Hex (`#C4A574`) or short label |
| `isActive` | boolean | No | Default `true` |
| `polishes` | array | No | Nested polish options; omit for none |
| `polishes[].name` | string | Yes | — |
| `polishes[].slug` | string | Yes | Unique within this wood |
| `polishes[].color` | string | Yes | Hex or short label |
| `polishes[].isActive` | boolean | No | Default `true` |

Response includes `polishes: [{ id, name, slug, color, isActive }]`.

---

## GET /api/v1/woods

Query: `page`, `limit`, `isActive`, `name` (partial).

Each item includes its `polishes` array.

---

## PATCH /api/v1/woods/:id

Partial update. Set `isActive: false` to hide a wood globally (products that still reference it will not expose it as selectable while the wood is inactive).

`polishes` uses **replace** semantics:

- Omit → leave existing polishes unchanged
- `[]` → clear all polishes
- Non-empty → replace all polishes for that wood

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
- Each wood entry includes **active** `polishes` for storefront selection

Example detail wood entry:

```json
{
  "id": 1,
  "name": "CSUM",
  "slug": "csum",
  "color": "#C4A574",
  "isActive": true,
  "isAvailable": true,
  "polishes": [
    { "id": 1, "name": "Matte", "slug": "matte", "color": "#E8E8E8", "isActive": true }
  ]
}
```

---

## Cart / order selection

| Situation | Rule |
|-----------|------|
| `woodId` omitted | Always OK (optional customization) |
| `woodId` provided and available for product | Accepted; snapshots `woodName` / `woodColor` |
| `woodId` provided but not available | `400` |

Order line items store `woodId` plus snapshots `woodName` / `woodColor` when selected.

Polish and fabric selection on cart/order lines is not persisted in this phase (catalog + product assignment only).
