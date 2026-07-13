# Categories API

Top-level categories and sub-categories are stored in **separate tables**. Products link to `SubCategory`, not `Category`.

[← Back to index](./README.md) · [Products docs](./products.md)

---

## Overview

```text
Category (top-level)  →  SubCategory  →  Product
   Bedroom                  Beds            Oak Bed
   Living                   Coffee Tables   ...
```

- **Category** — top-level groups (Bedroom, Living, Dining, …)
- **SubCategory** — assignable product category with optional `heading` for navigation columns
- **`isActive`** — hide categories/sub-categories from the public tree without deleting them
- **No delete endpoints** — update records as needed; set `isActive: false` to deactivate

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /categories` | `create-categories` | Yes | Yes | No |
| `GET /categories` | `view-categories` | Yes | Yes | Yes |
| `GET /categories/tree` | **Public** | — | — | — |
| `GET /admin/categories/tree` | `view-categories` | Yes | Yes | Yes |
| `GET /categories/:id` | `view-categories` | Yes | Yes | Yes |
| `PATCH /categories/:id` | `update-categories` | Yes | Yes | No |
| `POST /sub-categories` | `create-categories` | Yes | Yes | No |
| `GET /sub-categories` | `view-categories` | Yes | Yes | Yes |
| `GET /sub-categories/:id` | `view-categories` | Yes | Yes | Yes |
| `PATCH /sub-categories/:id` | `update-categories` | Yes | Yes | No |

---

## Categories

### Endpoints

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `POST` | `/api/v1/categories` | `create-categories` | `201` |
| `GET` | `/api/v1/categories` | `view-categories` | `200` |
| `GET` | `/api/v1/categories/tree` | **Public** | `200` |
| `GET` | `/api/v1/admin/categories/tree` | `view-categories` | `200` |
| `GET` | `/api/v1/categories/:id` | `view-categories` | `200` |
| `PATCH` | `/api/v1/categories/:id` | `update-categories` | `200` |

### POST /api/v1/categories

```json
{
  "name": "Bedroom",
  "slug": "bedroom",
  "description": "Bedroom furniture"
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `slug` | string | Yes (unique) |
| `description` | string | No |
| `isActive` | boolean | No (default `true`) |

### GET /api/v1/categories/tree

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns **active** top-level categories with nested **active** sub-categories, sorted by latest `updatedAt` first (for storefront navigation).

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bedroom",
      "slug": "bedroom",
      "description": "Bedroom furniture",
      "subCategories": [
        {
          "id": 1,
          "name": "Beds",
          "slug": "beds",
          "heading": "Beds",
          "description": "Beds · Beds",
          "categoryId": 1,
          "productsCount": 0
        }
      ]
    }
  ]
}
```

### cURL

```bash
curl http://localhost:5000/api/v1/categories/tree
```

### GET /api/v1/admin/categories/tree

| | |
|---|---|
| **Auth** | Bearer token required |
| **Permission** | `view-categories` |
| **Status** | `200` |

Returns **all** categories and sub-categories, including inactive records. Sorted by latest `updatedAt` first. Each node includes `isActive` and `updatedAt`.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bedroom",
      "slug": "bedroom",
      "description": "Bedroom furniture",
      "isActive": true,
      "updatedAt": "2026-07-13T10:00:00.000Z",
      "subCategories": [
        {
          "id": 1,
          "name": "Beds",
          "slug": "beds",
          "heading": "Beds",
          "description": "Beds · Beds",
          "categoryId": 1,
          "productsCount": 0,
          "isActive": false,
          "updatedAt": "2026-07-13T09:30:00.000Z"
        }
      ]
    }
  ]
}
```

### cURL

```bash
curl http://localhost:5000/api/v1/admin/categories/tree \
  -H "Authorization: Bearer $TOKEN"
```

### Activate / deactivate

Use `PATCH /api/v1/categories/:id` or `PATCH /api/v1/sub-categories/:id`:

```json
{ "isActive": false }
```

---

## Sub-categories

### Endpoints

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `POST` | `/api/v1/sub-categories` | `create-categories` | `201` |
| `GET` | `/api/v1/sub-categories` | `view-categories` | `200` |
| `GET` | `/api/v1/sub-categories/:id` | `view-categories` | `200` |
| `PATCH` | `/api/v1/sub-categories/:id` | `update-categories` | `200` |

### POST /api/v1/sub-categories

```json
{
  "name": "Beds",
  "slug": "beds",
  "categoryId": 1,
  "heading": "Beds",
  "description": "Beds · Beds"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique globally |
| `categoryId` | integer | Yes | Must reference a top-level category |
| `heading` | string | No | Navigation column group |
| `description` | string | No | — |
| `isActive` | boolean | No (default `true`) |

### GET /api/v1/sub-categories

| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | integer | Filter by parent category |
| `name` | string | Partial name match |
| `slug` | string | Exact slug match |
| `isActive` | boolean | Filter by active status |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

Results are sorted by latest `updatedAt` first.

```bash
curl "http://localhost:5000/api/v1/sub-categories?categoryId=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Success response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Beds",
    "slug": "beds",
    "heading": "Beds",
    "description": "Beds · Beds",
    "categoryId": 1,
    "isActive": true,
    "category": {
      "id": 1,
      "name": "Bedroom",
      "slug": "bedroom"
    },
    "productsCount": 0,
    "createdAt": "2026-07-10T07:00:00.000Z",
    "updatedAt": "2026-07-10T07:00:00.000Z"
  }
}
```

---

## Seeded catalogue

After `npm run prisma:seed`:

### Top-level categories

| ID | Slug | Name |
|----|------|------|
| `1` | `bedroom` | Bedroom |
| `2` | `living` | Living |
| `3` | `dining` | Dining |
| `4` | `study-room` | Study Room |
| `5` | `decor` | Decor |

### Sub-categories (28 total)

Use `GET /api/v1/categories/tree` or `GET /api/v1/sub-categories?limit=100` for full IDs.

| Parent | Examples | Slug examples |
|--------|----------|---------------|
| Bedroom | Beds, Bedside Tables, Wardrobes | `beds`, `bedside-tables` |
| Living | Fabric Sofas, Coffee Tables, Home Temple | `fabric-sofas`, `coffee-tables` |
| Dining | 6-Seater Dining Sets, Dining Tables | `6-seater-dining-sets` |
| Study Room | Study Tables, Office Chairs, Bookshelves | `study-tables` |
| Decor | Decorative items and accessories | `decorative-items-and-accessories` |

---

## Product assignment

Products use **`subCategoryId`**, not `categoryId`:

```json
{
  "name": "Oak Bed",
  "slug": "oak-bed",
  "price": 35000,
  "stock": 5,
  "subCategoryId": 1
}
```

See [products.md](./products.md) for full product API details.
