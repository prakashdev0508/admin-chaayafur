# Woods API

Global wood catalog for product wood selection (Sonic, Peak, Engineering, etc.), with optional polish options nested under each wood. **Product-specific price adjustments** live on the product assignment, not on the global catalog.

[← Back to index](./README.md) · [Fabrics](./fabrics.md) · [Products](./products.md) · [Cart](./cart.md) · [Orders](./orders.md)

---

## Overview

- Woods are a **global catalog** (`name`, `slug`, `color`, `isActive`) — no global price
- Each wood can have nested **polishes** (`name`, `slug`, `color`, `isActive`) unique per wood (`woodId` + `slug`)
- Products opt into woods via `woods: [{ woodId, isActive?, priceAdjustment? }]` on create/update
- Products opt into polishes via `polishes: [{ woodPolishId, isActive?, priceAdjustment? }]` (must belong to an assigned wood)
- Per-product `isActive` can disable a wood/polish for one product without deleting the catalog entry
- Per-product `priceAdjustment` (default `0`) is added to the product base price when that option is selected
- Seeded defaults: **Sonic**, **Peak**, **Engineering**
- Cart/checkout `woodId` / `polishId` are **optional customizations** — omit freely; if sent, they must be active options assigned to that product

### Who can access?

| Endpoint | Permission |
|----------|------------|
| `POST /woods` | `create-products` |
| `PATCH /woods/:id` | `update-products` |
| `GET /woods` | Public (no auth); defaults to `isActive=true` |
| `GET /woods/:id` | Public (no auth) |

Use `GET /woods` for admin catalog pickers. Product detail exposes per-product `woods` (with nested polishes + `priceAdjustment`) when assigned — that is what the storefront should use.

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/v1/woods` | Staff | `201` |
| `GET` | `/api/v1/woods` | Public | `200` |
| `GET` | `/api/v1/woods/:id` | Public | `200` |
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
    { "woodId": 1, "isActive": true, "priceAdjustment": 3000 },
    { "woodId": 2, "isActive": false, "priceAdjustment": 0 }
  ],
  "polishes": [
    { "woodPolishId": 5, "isActive": true, "priceAdjustment": 500 }
  ]
}
```

| Field | Rules |
|-------|-------|
| `woods[].woodId` | Must exist in the wood catalog |
| `woods[].isActive` | Optional; default `true` |
| `woods[].priceAdjustment` | Optional; min `0`; default `0` |
| `polishes[].woodPolishId` | Must exist; must belong to a wood assigned to this product |
| `polishes[].isActive` | Optional; default `true` |
| `polishes[].priceAdjustment` | Optional; min `0`; default `0` |

- Omitting `woods` / `polishes` leaves existing assignments unchanged (update) / none (create)
- Passing `[]` clears that assignment list
- When `woods` is updated **without** `polishes`, active polishes of the assigned woods are synced at `priceAdjustment: 0` (existing prices for still-valid polishes are preserved; orphaned polishes are removed)
- Product **detail** responses include all assigned woods/polishes with `isAvailable` and `priceAdjustment`
- Product **list** responses include only available options
- Each wood entry nests only **product-assigned** polishes (not every global polish on that wood)
- Top-level `polishes` array is also returned for admin forms

Example detail wood entry:

```json
{
  "id": 1,
  "name": "Sheesham",
  "slug": "sheesham",
  "color": "#8B5E3C",
  "isActive": true,
  "isAvailable": true,
  "priceAdjustment": "3000.00",
  "polishes": [
    {
      "id": 5,
      "name": "Matte",
      "slug": "matte",
      "color": "#E8E8E8",
      "isActive": true,
      "isAvailable": true,
      "priceAdjustment": "500.00"
    }
  ]
}
```

---

## Cart / order selection

| Situation | Rule |
|-----------|------|
| `woodId` omitted | Always OK (optional customization); wood adj = `0` |
| `woodId` provided and assigned + active for product | Accepted; uses that product's `priceAdjustment` |
| `woodId` provided but not available for product | `400` |
| `polishId` omitted | Always OK; polish adj = `0` |
| `polishId` provided | Requires `woodId`; polish must be assigned to the product and belong to that wood |
| `polishId` provided but not available | `400` |

**Unit price** = `Product.price + woodPriceAdjustment + polishPriceAdjustment + fabricPriceAdjustment`.

Order line items snapshot `woodId` / `woodName` / `woodColor` / `woodPriceAdjustment` and the same for polish when selected. See [cart.md](./cart.md) and [orders.md](./orders.md).
