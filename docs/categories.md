# Categories API

Top-level categories and sub-categories are stored in **separate tables**. Products associate with **one or more** categories and sub-categories via join tables (`ProductCategory`, `ProductSubCategory`).

[← Back to index](./README.md) · [Products docs](./products.md)

---

## Overview

```text
Category (top-level)  ←→  Product  ←→  SubCategory
   Bedroom / Living          Oak Bed          Beds / Sofas
```

- **Category** — top-level groups (Bedroom, Living, Dining, …)
- **SubCategory** — assignable product category with optional `heading` for navigation columns
- **`isActive`** — hide categories/sub-categories from the public tree without deleting them
- **`isSignatureCollection`** — CMS flag for featured/signature collections; filter with `GET /categories?isSignatureCollection=true`
- **`sortOrder`** — display order for **all** categories and sub-categories (lower first). Lists and trees always sort by `sortOrder ASC`, then `id ASC` (same pattern as home banners). Set via create/PATCH; auto-assigned on create when omitted (categories: global max+1; sub-categories: max+1 within parent category)
- **Category image** — optional single image via [uploads.md](./uploads.md) (`POST /uploads/category-images`), then attach on create/update
- **Sub-category image** — optional single image via [uploads.md](./uploads.md) (`POST /uploads/sub-category-images`), then attach on create/update
- **Delete** — `DELETE /categories/:id` and `DELETE /sub-categories/:id` permanently remove a row when **no products** are attached (active or inactive). Returns `409` if any product link exists. Prefer `isActive: false` to hide without deleting.

### Sync catalog from JSON (slug merge)

Use when production already has some categories/subcategories and you need to add missing ones from a fuller catalog without overwriting existing rows (except `sortOrder`).

1. Point `DATABASE_URL` at the **source** DB and export:

```bash
npm run sync:categories -- --export
```

Writes [`public/categories-subcategories.json`](../public/categories-subcategories.json).

2. Point `DATABASE_URL` at **production** and sync:

```bash
npm run sync:categories -- --dry-run   # simulate
npm run sync:categories                # apply
```

**Rules:** match by `slug`. Existing slug → update `sortOrder` only. Missing slug → insert (subcategories resolve parent by **category slug**). Rows only in production are left untouched. No deletes.

### Cleanup empty categories / subcategories

Permanently deletes **inactive** subcategories with no product links, then **inactive** categories with no product links and no active/product-linked subcategories. Active empty rows are left alone.

```bash
npm run cleanup:empty-categories -- --dry-run
npm run cleanup:empty-categories
```

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /categories` | `create-categories` | Yes | Yes | No |
| `GET /categories` | `view-categories` | Yes | Yes | Yes |
| `GET /categories/tree` | **Public** | — | — | — |
| `GET /admin/categories/tree` | `view-categories` | Yes | Yes | Yes |
| `GET /categories/:id` | `view-categories` | Yes | Yes | Yes |
| `PATCH /categories/:id` | `update-categories` | Yes | Yes | No |
| `DELETE /categories/:id` | `delete-categories` | Yes | Yes | No |
| `POST /uploads/category-images` | `create-categories` **or** `update-categories` | Yes | Yes | No |
| `POST /uploads/sub-category-images` | `create-categories` **or** `update-categories` | Yes | Yes | No |
| `POST /sub-categories` | `create-categories` | Yes | Yes | No |
| `GET /sub-categories` | `view-categories` | Yes | Yes | Yes |
| `GET /sub-categories/:id` | `view-categories` | Yes | Yes | Yes |
| `PATCH /sub-categories/:id` | `update-categories` | Yes | Yes | No |
| `DELETE /sub-categories/:id` | `delete-categories` | Yes | Yes | No |

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
| `DELETE` | `/api/v1/categories/:id` | `delete-categories` | `204` / `409` if products attached |

### POST /api/v1/categories

```json
{
  "name": "Bedroom",
  "slug": "bedroom",
  "description": "Bedroom furniture",
  "isSignatureCollection": true,
  "image": {
    "url": "https://cdn.example.com/categories/bedroom.webp",
    "storageKey": "categories/2026/07/uuid.webp"
  }
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `slug` | string | Yes (unique) |
| `description` | string | No |
| `isActive` | boolean | No (default `true`) |
| `isSignatureCollection` | boolean | No (default `false`) |
| `sortOrder` | integer | No (auto-assigned to max+1 when omitted) |
| `image` | object | No — `{ url, storageKey? }` from [uploads.md](./uploads.md) |

### GET /api/v1/categories

| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Partial name match |
| `slug` | string | Exact slug match |
| `isActive` | boolean | Filter by active status |
| `isSignatureCollection` | boolean | Filter signature collection categories |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

When listing categories, results are always sorted by `sortOrder` ascending (then `id`).

### Signature collection reorder

Reorder categories (including signature collections) by PATCHing `sortOrder` on each category (same pattern as home banners). Lower values appear first.

To swap positions of categories with ids `3` and `5`:

```bash
curl -X PATCH http://localhost:5000/api/v1/categories/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sortOrder": 5}'

curl -X PATCH http://localhost:5000/api/v1/categories/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sortOrder": 3}'
```

Or assign explicit order: `{ "sortOrder": 0 }`, `{ "sortOrder": 1 }`, etc.

### GET /api/v1/categories/tree

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns **active** top-level categories with nested **active** sub-categories, sorted by `sortOrder ASC`, then `id ASC` (for storefront navigation). Includes `isSignatureCollection`, `sortOrder`, and `imageUrl` on categories and `sortOrder` on sub-categories.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bedroom",
      "slug": "bedroom",
      "description": "Bedroom furniture",
      "isSignatureCollection": true,
      "sortOrder": 0,
      "imageUrl": "https://cdn.example.com/categories/bedroom.webp",
      "subCategories": [
        {
          "id": 1,
          "name": "Beds",
          "slug": "beds",
          "heading": "Beds",
          "description": "Beds · Beds",
          "categoryId": 1,
          "imageUrl": "https://cdn.example.com/sub-categories/beds.webp",
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

Returns **all** categories and sub-categories, including inactive records. Sorted by `sortOrder ASC`, then `id ASC`. Each node includes `isActive` and `updatedAt`. Sub-categories include `sortOrder`.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bedroom",
      "slug": "bedroom",
      "description": "Bedroom furniture",
      "isSignatureCollection": false,
      "sortOrder": 0,
      "imageUrl": null,
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
          "imageUrl": null,
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

### DELETE /api/v1/categories/:id

| | |
|---|---|
| **Auth** | Bearer + `delete-categories` |
| **Status** | `204` on success; `404` if missing; `409` if any product is linked |

Blocks delete when **any** product (active or inactive) is linked via `ProductCategory` **or** via any subcategory’s `ProductSubCategory`. Empty child subcategories are removed by cascade.

```bash
curl -X DELETE http://localhost:5000/api/v1/categories/1 \
  -H "Authorization: Bearer $TOKEN"
```

### DELETE /api/v1/sub-categories/:id

| | |
|---|---|
| **Auth** | Bearer + `delete-categories` |
| **Status** | `204` on success; `404` if missing; `409` if any product is linked |

Blocks delete when **any** product (active or inactive) is linked via `ProductSubCategory`.

```bash
curl -X DELETE http://localhost:5000/api/v1/sub-categories/1 \
  -H "Authorization: Bearer $TOKEN"
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
| `DELETE` | `/api/v1/sub-categories/:id` | `delete-categories` | `204` / `409` if products attached |

### POST /api/v1/sub-categories

```json
{
  "name": "Beds",
  "slug": "beds",
  "categoryId": 1,
  "heading": "Beds",
  "description": "Beds · Beds",
  "image": {
    "url": "https://cdn.example.com/sub-categories/beds.webp",
    "storageKey": "sub-categories/2026/08/uuid.webp"
  }
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
| `sortOrder` | integer | No (auto-assigned to max+1 within parent category when omitted) |
| `image` | object | No | `{ url, storageKey? }` from [uploads.md](./uploads.md) |

### GET /api/v1/sub-categories

| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | integer | Filter by parent category |
| `name` | string | Partial name match |
| `slug` | string | Exact slug match |
| `isActive` | boolean | Filter by active status |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

Results are sorted by `sortOrder ASC`, then `id ASC`.

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
    "sortOrder": 0,
    "image": {
      "url": "https://cdn.example.com/sub-categories/beds.webp",
      "storageKey": "sub-categories/2026/08/uuid.webp"
    },
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

Products use **`categoryIds`** and **`subCategoryIds`** arrays (at least one each):

```json
{
  "name": "Oak Bed",
  "slug": "oak-bed",
  "price": 35000,
  "stock": 5,
  "categoryIds": [1],
  "subCategoryIds": [1]
}
```

See [products.md](./products.md) for full product API details.
