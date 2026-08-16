# Products API

Create, update, and list furniture products.

[← Back to index](./README.md) · [Categories docs](./categories.md) · [Woods](./woods.md) · [Fabrics](./fabrics.md) · [Home / CMS](./home.md) · [Auth docs](./auth.md) · [Orders / checkout](./orders.md)

---

## Overview

- **No delete endpoint** — use `isActive: false` to soft-hide products
- **Product images** — upload via [uploads.md](./uploads.md) (Cloudflare R2), then attach URLs in product create/update (max **5** per product)
- **`productFeatures`** — optional array of feature strings (e.g. `"Solid oak wood"`, `"1-year warranty"`) for product detail bullets; max **10** items, 200 chars each
- **Bulk Excel upload** — stage images via ZIP (`{productSlug}__{sortOrder}.{ext}`), download a sample template with dropdowns, then enqueue an Excel job that matches staged images by slug (see [Bulk upload](#bulk-upload) and [upload-jobs.md](./upload-jobs.md))
- **CMS tags** — optional booleans `isBestSeller`, `isFeaturedProduct`, `isMostPopular`, `isNewArrival` for storefront sections; filter with `GET /products?tag=isFeaturedProduct`, or assign via `PATCH /admin/cms/products/:id/tags` (see [home.md](./home.md))
- Aggregated home sections: [home.md](./home.md) (`GET /home`)
- Default list shows only **active** products (`isActive=true`)
- **`price`** is the selling price (after discount) — used for cart, checkout, and filters
- **`priceWithoutDiscount`** is optional compare-at / MRP; display-only, does not affect checkout
- **`hsnCode`** is optional (4–8 digits); tax invoices use it when set, otherwise `INVOICE_HSN`
- **Product-level customization pricing** — woods, polishes, and fabrics each carry a per-product `priceAdjustment` (default `0`). Products also have a free-form **`customization`** JSON array (`groupName`, `value`, `price`, `image`). Cart/checkout unit price = `base price + wood adj + polish adj + fabric adj + selected customization prices`. See [Product-level customization pricing](#product-level-customization-pricing)
- **`woods`** — product wood options with nested polishes and `priceAdjustment` (see [woods.md](./woods.md)); detail includes unavailable woods with `isAvailable: false`
- **`polishes`** — product polish options (also nested under each wood); must belong to an assigned wood
- **`fabrics`** — product fabric options with `priceAdjustment` (see [fabrics.md](./fabrics.md)); same availability pattern as woods; independent of wood
- **`customization`** — admin-defined option list `{ groupName, value, price, image }[]`. Identity is `groupName` + `value` (unique per product). Omit on PATCH to leave unchanged; pass `[]` to clear. Max **50** options. Cart/checkout pick by `groupName` + `value` (at most one value per group); server resolves `price` / `image` from this array.
- **Backfill** — `npm run backfill:product-customization` copies active wood / polish / fabric assignments into `customization` for products that still have an empty array (`--dry-run` supported). Catalog join rows are not deleted.
- Products link to **`subCategoryId`** (not top-level `categoryId`)
- Public list responses are **cached** in Upstash Redis (60s default) and return `Cache-Control` headers for CDN edge caching
- Cache is invalidated automatically when products, categories, or sub-categories are created or updated

### Product-level customization pricing

Customization options (Wood, Polish, Fabric) do **not** use a global price. Each product stores its own price adjustments on the join tables:

| Join table | Assignment field | Price field |
|------------|------------------|-------------|
| `ProductWood` | `woods[].woodId` | `woods[].priceAdjustment` |
| `ProductPolish` | `polishes[].woodPolishId` | `polishes[].priceAdjustment` |
| `ProductFabric` | `fabrics[].fabricId` | `fabrics[].priceAdjustment` |

**Rules**

- Omit `priceAdjustment` → defaults to `0`
- Only options assigned to the product are returned on product detail / list and accepted on cart / checkout
- Polishes must belong to a wood assigned to the same product
- When `woods` is updated without an explicit `polishes` array, active polishes of the assigned woods are synced automatically at `priceAdjustment: 0` (existing polish prices for still-valid polishes are preserved)
- Storefront live price: `product.price + selectedWood.priceAdjustment + selectedPolish.priceAdjustment + selectedFabric.priceAdjustment + sum(selected customization.price)`

Woods / polishes / fabrics stay assigned as today. Free-form `customization` is additive until those catalog groups are removed.

**Admin create/update example**

```json
{
  "woods": [
    { "woodId": 1, "isActive": true, "priceAdjustment": 3000 },
    { "woodId": 2, "isActive": true, "priceAdjustment": 6000 }
  ],
  "polishes": [
    { "woodPolishId": 5, "isActive": true, "priceAdjustment": 500 }
  ],
  "fabrics": [
    { "fabricId": 3, "isActive": true, "priceAdjustment": 1500 }
  ],
  "customization": [
    { "groupName": "Wood", "value": "Sheesham", "price": 3000, "image": "https://cdn.example.com/sheesham.webp" },
    { "groupName": "Fabric", "value": "Linen Beige", "price": 1500, "image": "" }
  ]
}
```

**Product detail customization shape**

```json
{
  "woods": [
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
  ],
  "polishes": [
    {
      "id": 5,
      "woodId": 1,
      "name": "Matte",
      "slug": "matte",
      "color": "#E8E8E8",
      "isActive": true,
      "isAvailable": true,
      "priceAdjustment": "500.00"
    }
  ],
  "fabrics": [
    {
      "id": 3,
      "name": "Linen Beige",
      "slug": "linen-beige",
      "color": "#D4C4A8",
      "isActive": true,
      "isAvailable": true,
      "priceAdjustment": "1500.00"
    }
  ]
}
```

Frontend should show only these assigned options and recompute the displayed price when the customer changes wood / polish / fabric.

### Sub-category assignment

Use a sub-category ID from [categories.md](./categories.md). Example after seed:

| Parent | Sub-category | `subCategoryId` |
|--------|--------------|-----------------|
| Bedroom | Beds | `1` |
| Living | Coffee Tables | (use `GET /sub-categories`) |

> `subCategoryId` must reference a row in the `SubCategory` table.

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `POST /products` | `create-products` | Yes | Yes | No |
| `GET /products/bulk-upload/sample` | `create-products` | Yes | Yes | No |
| `POST /products/bulk-upload/images` | `create-products` | Yes | Yes | No |
| `GET /products/bulk-upload/staged-images` | `view-products` | Yes | Yes | Yes |
| `DELETE /products/bulk-upload/staged-images/:id` | `create-products` | Yes | Yes | No |
| `POST /products/bulk-upload` | `create-products` | Yes | Yes | No |
| `GET /upload-jobs` / `GET /upload-jobs/:id` | `view-products` | Yes | Yes | Yes |
| `GET /upload-jobs/:id/download/uploaded` | `view-products` | Yes | Yes | Yes |
| `GET /upload-jobs/:id/download/result` | `view-products` | Yes | Yes | Yes |
| `PATCH /products/:id` | `update-products` | Yes | Yes | No |
| `PATCH /admin/cms/products/:id/tags` | `update-products` | Yes | Yes | No |
| `GET /admin/products/:id` | `view-products` | Yes | Yes | Yes |
| `POST /uploads/product-images` | `create-products` or `update-products` | Yes | Yes | No |
| `GET /products` | **Public** | — | — | — |
| `GET /products/filters` | **Public** | — | — | — |
| `GET /products/:idOrSlug` | **Public** | — | — | — |

---

## Endpoints

| Method | Endpoint | Permission | Status |
|--------|----------|------------|--------|
| `POST` | `/api/v1/products` | `create-products` | `201` |
| `GET` | `/api/v1/products/bulk-upload/sample` | `create-products` | `200` |
| `POST` | `/api/v1/products/bulk-upload/images` | `create-products` | `202` |
| `GET` | `/api/v1/products/bulk-upload/staged-images` | `view-products` | `200` |
| `DELETE` | `/api/v1/products/bulk-upload/staged-images/:id` | `create-products` | `200` |
| `POST` | `/api/v1/products/bulk-upload` | `create-products` | `202` |
| `GET` | `/api/v1/upload-jobs` | `view-products` | `200` |
| `GET` | `/api/v1/upload-jobs/:id` | `view-products` | `200` |
| `GET` | `/api/v1/upload-jobs/:id/download/uploaded` | `view-products` | `200` |
| `GET` | `/api/v1/upload-jobs/:id/download/result` | `view-products` | `200` |
| `PATCH` | `/api/v1/products/:id` | `update-products` | `200` |
| `GET` | `/api/v1/admin/products/:id` | `view-products` | `200` |
| `GET` | `/api/v1/products` | **Public** | `200` |
| `GET` | `/api/v1/products/filters` | **Public** | `200` |
| `GET` | `/api/v1/products/:idOrSlug` | **Public** | `200` |

`GET /products` is a public, cacheable endpoint. Responses include:

```http
Cache-Control: public, max-age=60, s-maxage=300
```

Protected endpoints (`POST`, `PATCH`) require:

```http
Authorization: Bearer <accessToken>
```

---

## POST /api/v1/products

### Request body

```json
{
  "name": "Oak Dining Table",
  "slug": "oak-dining-table",
  "description": "Solid oak dining table for 6 people",
  "price": 24999.99,
  "priceWithoutDiscount": 29999.99,
  "stock": 10,
  "subCategoryId": 1,
  "isActive": true,
  "isBestSeller": false,
  "isFeaturedProduct": true,
  "isMostPopular": false,
  "isNewArrival": true,
  "productFeatures": [
    "Solid oak wood",
    "Seats 6 people",
    "1-year warranty"
  ],
  "woods": [
    { "woodId": 1, "isActive": true, "priceAdjustment": 3000 },
    { "woodId": 2, "isActive": true, "priceAdjustment": 6000 }
  ],
  "polishes": [
    { "woodPolishId": 5, "isActive": true, "priceAdjustment": 500 }
  ],
  "fabrics": [
    { "fabricId": 3, "isActive": true, "priceAdjustment": 1500 }
  ],
  "customization": [
    { "groupName": "Wood", "value": "Sheesham", "price": 3000, "image": "" }
  ],
  "images": [
    {
      "url": "https://cdn.example.com/products/oak-table.webp",
      "storageKey": "products/2026/07/8f3c2a1b.webp",
      "altText": "Oak dining table front view",
      "sortOrder": 0
    }
  ]
}
```

### Request fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | — |
| `slug` | string | Yes | Unique across all products |
| `description` | string | No | — |
| `price` | number | Yes | Min `0`. **Selling price** (after discount). Used for cart, checkout, and filters. |
| `priceWithoutDiscount` | number | No | Min `0`. Compare-at / MRP before discount. Optional; does not affect checkout. |
| `hsnCode` | string | No | 4–8 digits. Optional GST HSN; invoices fall back to `INVOICE_HSN` when omitted. |
| `stock` | number | Yes | Min `0` |
| `subCategoryId` | integer | Yes | Must exist in `SubCategory` table |
| `isActive` | boolean | No | Default `true` |
| `isBestSeller` | boolean | No | Default `false` — CMS merchandising tag |
| `isFeaturedProduct` | boolean | No | Default `false` — CMS merchandising tag |
| `isMostPopular` | boolean | No | Default `false` — CMS merchandising tag |
| `isNewArrival` | boolean | No | Default `false` — CMS merchandising tag |
| `productFeatures` | string[] | No | Max 10 items; each string max 200 chars. Default `[]` |
| `woods` | array | No | `{ woodId, isActive?, priceAdjustment? }[]` — assign woods for this product. Pass `[]` to clear. `priceAdjustment` defaults to `0`. See [woods.md](./woods.md) |
| `polishes` | array | No | `{ woodPolishId, isActive?, priceAdjustment? }[]` — assign polishes for this product. Each polish must belong to an assigned wood. Pass `[]` to clear. Defaults to `0` when omitted |
| `fabrics` | array | No | `{ fabricId, isActive?, priceAdjustment? }[]` — assign fabrics for this product. Pass `[]` to clear. `priceAdjustment` defaults to `0`. See [fabrics.md](./fabrics.md) |
| `customization` | array | No | `{ groupName, value, price, image? }[]`. Max 50. Unique `groupName` + `value`. `price` >= 0. `image` optional URL or `""`. Omit on update to leave unchanged; `[]` clears. |
| `images` | array | No | Max 5 items. Upload files first via [uploads.md](./uploads.md); include `storageKey` from upload response |

### Success response `201`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "description": "Solid oak dining table for 6 people",
    "price": "24999.99",
    "priceWithoutDiscount": "29999.99",
    "stock": 10,
    "isActive": true,
    "isBestSeller": false,
    "isFeaturedProduct": true,
    "isMostPopular": false,
    "isNewArrival": true,
    "productFeatures": [
      "Solid oak wood",
      "Seats 6 people",
      "1-year warranty"
    ],
    "subCategoryId": 1,
    "subCategory": {
      "id": 1,
      "name": "Beds",
      "slug": "beds",
      "heading": "Beds",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom"
      }
    },
    "images": [
      {
        "id": 10,
        "url": "https://cdn.example.com/products/oak-table.jpg",
        "storageKey": "products/2026/07/8f3c2a1b.webp",
        "altText": "Oak dining table front view",
        "sortOrder": 0
      }
    ],
    "ratingAverage": null,
    "reviewCount": 0,
    "createdAt": "2026-07-09T18:02:58.000Z",
    "updatedAt": "2026-07-09T18:02:58.000Z"
  }
}
```

> `price` is returned as a **string** for decimal precision.
> Always round-trip `storageKey` when updating images so kept files are not deleted from R2.
> `ratingAverage` / `reviewCount` reflect visible product reviews only — see [reviews.md](./reviews.md).
> When `images` is sent on update, only storage keys that are **no longer** in the new list are deleted from Cloudflare R2.

### Errors

| Status | When |
|--------|------|
| `400` | Invalid payload |
| `401` | Missing or invalid token |
| `403` | Missing `create-products` permission |
| `404` | Sub-category not found |
| `409` | Slug already exists |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "price": 24999.99,
    "stock": 10,
    "subCategoryId": 1,
    "productFeatures": ["Solid oak wood", "Seats 6 people"]
  }'
```

---

## Bulk upload

Two-step async flow (DB-backed queue on the EC2 worker). Full job APIs: [upload-jobs.md](./upload-jobs.md).

### Workflow

1. **Stage images** — name files `{productSlug}__{sortOrder}.{jpg|jpeg|png|webp}` (e.g. `oak-dining-table__0.jpg`, `oak-dining-table__1.png`), zip them, upload: `POST /api/v1/products/bulk-upload/images` → returns `{ jobId }`. A single underscore also works — see [Image filename convention](#image-filename-convention)
2. Poll `GET /api/v1/upload-jobs/:jobId` until `COMPLETED` / `COMPLETED_WITH_ERRORS`. Optionally inspect staged rows: `GET /api/v1/products/bulk-upload/staged-images?slug=oak-dining-table&unconsumed=true`
3. Download the sample template: `GET /api/v1/products/bulk-upload/sample` (includes a `Lookups` sheet + dropdowns for `subCategoryId`, the boolean columns, and every wood / polish / fabric slot)
4. Fill one product per row (**no images column required**) and upload: `POST /api/v1/products/bulk-upload` → returns `{ jobId }`
5. Poll the sheet job. When done, download the result workbook via `GET /api/v1/upload-jobs/:id/download/result` (columns include `imagesAttached` + `status`)

During sheet processing, for each row the worker looks up unconsumed staged images matching the product `slug` (ordered by `sortOrder`, max 5) and attaches them. If none are found, the product is still created and status is `Success (no images found for slug "…")`.

Legacy sheets may still include an `images` column of public URLs; when present it overrides staged matching.

### Image filename convention

| Part | Rule |
|------|------|
| `productSlug` | must resolve to the Excel `slug` (see normalization below) |
| separator | double underscore `__` (a single `_` is also accepted) |
| `sortOrder` | integer `0`–`4` (max 5 images per product); leading zeros allowed |
| extension | `jpg`, `jpeg`, `png`, or `webp` (case-insensitive) |

**Slug normalization** — the part before the trailing `_{number}` is lowercased, and underscores and spaces are folded to hyphens. The last underscore run before the number is always the separator.

| Filename | Resolved slug | sortOrder |
|----------|---------------|-----------|
| `oak-dining-table__0.jpg` | `oak-dining-table` | `0` |
| `testproduct3_02.jpg` | `testproduct3` | `2` |
| `testproduct3_4_01.jpg` | `testproduct3-4` | `1` |
| `Test_Product_3_01.JPG` | `test-product-3` | `1` |
| `img2.jpg` | rejected — no sort order | — |

Invalid names are recorded as failed rows in the image-staging result workbook (they do not abort the job).

### Excel columns

Header names are case-insensitive. Backend appends **`imagesAttached`** and **`status`** on the result file.

| Column | Required | Format |
|--------|----------|--------|
| `name` | Yes | string |
| `slug` | Yes | unique slug (must match staged image filenames) |
| `description` | No | string |
| `price` | Yes | number |
| `priceWithoutDiscount` | No | number |
| `hsnCode` | No | 4–8 digit HSN (optional) |
| `stock` | Yes | integer ≥ 0 |
| `subCategoryId` | Yes | integer **or** dropdown label `12 - Living Room > Sofas` |
| `isActive` | No | `true` / `false` (dropdown; default true) |
| `isBestSeller` | No | `true` / `false` |
| `isFeaturedProduct` | No | `true` / `false` |
| `isMostPopular` | No | `true` / `false` |
| `isNewArrival` | No | `true` / `false` |
| `productFeatures` | No | pipe-separated, max 10: `Solid oak\|Seats 6\|1-year warranty` |
| `wood1` … `wood3` | No | **dropdown** of woods; each paired with a price column |
| `wood1Price` … `wood3Price` | No | number ≥ 0; the `priceAdjustment` for the wood in the same slot (blank = `0`) |
| `polish1` … `polish3` | No | **dropdown** of polishes; each must belong to an assigned wood |
| `polish1Price` … `polish3Price` | No | number ≥ 0 |
| `fabric1` … `fabric3` | No | **dropdown** of fabrics |
| `fabric1Price` … `fabric3Price` | No | number ≥ 0 |
| `images` | No (legacy) | comma-separated public URLs, max 5 — overrides staged images when present |
| `woods` / `polishes` / `fabrics` | No (legacy) | combined `id:priceAdjustment` list, e.g. `1:3000,2:6000` — only read when the numbered slots are all blank |
| `imagesAttached` | Backend-only | count of images attached for the row |
| `status` | Backend-only | `Success`, `Success (no images found for slug "…")`, or error message |

Limits: max **500** data rows per sheet (5 MB `.xlsx`); max **50 MB** / **200** files per image ZIP.

### Customization pricing

Every customization has its own dropdown column plus a price column, so no manual ID typing is needed:

| `wood1` | `wood1Price` | `wood2` | `wood2Price` | `polish1` | `polish1Price` |
|---|---|---|---|---|---|
| `1 - Sheesham` | `3000` | `2 - Teak` | `6000` | `5 - Sheesham / Natural` | `500` |

- Dropdown values are `{id} - {label}`; the backend reads the leading ID, so a bare `1` also works
- A blank price column defaults the adjustment to `0`
- Prices are product-specific — the same wood can be priced differently on each row
- Up to **3** options per type. Need more? Use the legacy combined `woods` / `polishes` / `fabrics` column instead, which has no limit
- Duplicate IDs across slots of the same type are rejected for that row
- Each polish must belong to one of the assigned woods
- If woods are set and no polishes are given, active polishes of those woods are synced automatically at price `0`

The **`Lookups`** sheet backs every dropdown and lists sub-categories, woods, polishes, and fabrics as `{id} - {label}`, plus usage notes in column G.

---

## GET /api/v1/products/bulk-upload/sample

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Status** | `200` |
| **Response** | Excel file download (`product-bulk-upload-sample.xlsx`) with `Products` + `Lookups` sheets |

### cURL

```bash
curl -OJ http://localhost:5000/api/v1/products/bulk-upload/sample \
  -H "Authorization: Bearer $TOKEN"
```

---

## POST /api/v1/products/bulk-upload/images

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (`.zip`) |
| **Status** | `202` |

Enqueues a `BULK_PRODUCT_IMAGES` job. Images are compressed to WebP and stored in R2; DB rows land in `staged_product_images` keyed by `(productSlug, sortOrder)`.

### Success response `202`

```json
{
  "success": true,
  "data": {
    "jobId": 12,
    "status": "PENDING"
  }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/products/bulk-upload/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./product-images.zip"
```

---

## GET /api/v1/products/bulk-upload/staged-images

| | |
|---|---|
| **Auth** | Bearer token + `view-products` |
| **Query** | `page`, `limit`, `slug`, `unconsumed` (`true`/`false`) |
| **Status** | `200` |

---

## DELETE /api/v1/products/bulk-upload/staged-images/:id

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Status** | `200` |

Deletes the staged row and its R2 object.

---

## POST /api/v1/products/bulk-upload

| | |
|---|---|
| **Auth** | Bearer token + `create-products` |
| **Content-Type** | `multipart/form-data` |
| **Field** | `file` (`.xlsx`) |
| **Status** | `202` |

Enqueues a `BULK_PRODUCT_UPLOAD` job. Processing is asynchronous — poll [upload-jobs.md](./upload-jobs.md).

### Success response `202`

```json
{
  "success": true,
  "data": {
    "jobId": 13,
    "status": "PENDING"
  }
}
```

### Errors (whole request / enqueue)

| Status | When |
|--------|------|
| `400` | Missing/invalid file |
| `401` | Missing or invalid token |
| `403` | Missing `create-products` permission |
| `503` | R2 storage is not configured |

Row-level failures appear in the result workbook after the job finishes (they do not fail enqueue).

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/products/bulk-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./products.xlsx"
```

---

## PATCH /api/v1/products/:id

Partial update. All body fields are optional.

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | — |
| `slug` | string | Unique across all products |
| `description` | string | — |
| `price` | number | Min `0`. Selling price (after discount). |
| `priceWithoutDiscount` | number | Min `0`. Compare-at / MRP before discount. |
| `hsnCode` | string | Optional 4–8 digit HSN code. |
| `stock` | number | Min `0` |
| `subCategoryId` | integer | Must exist in `SubCategory` table |
| `isActive` | boolean | Set `false` to hide product |
| `isBestSeller` | boolean | CMS tag |
| `isFeaturedProduct` | boolean | CMS tag |
| `isMostPopular` | boolean | CMS tag |
| `isNewArrival` | boolean | CMS tag |
| `productFeatures` | string[] | Replace entire list. Pass `[]` to clear all features |
| `customization` | array | Replace free-form options. Pass `[]` to clear. Omit to leave unchanged |
| `woods` | array | Replace wood assignments. `{ woodId, isActive?, priceAdjustment? }[]`. Pass `[]` to clear |
| `polishes` | array | Replace polish assignments. `{ woodPolishId, isActive?, priceAdjustment? }[]`. Pass `[]` to clear. Must belong to assigned woods |
| `fabrics` | array | Replace fabric assignments. `{ fabricId, isActive?, priceAdjustment? }[]`. Pass `[]` to clear |
| `images` | array | Replaces all images when provided (max 5) |

### cURL

```bash
curl -X PATCH http://localhost:5000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productFeatures": [
      "Solid oak wood",
      "Easy assembly",
      "Free delivery"
    ]
  }'
```

Hide a product:

```bash
curl -X PATCH http://localhost:5000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

## GET /api/v1/admin/products/:id

| | |
|---|---|
| **Auth** | Bearer token + `view-products` |
| **Status** | `200` |

**Use this for the admin Add/Edit Product page.** Returns the full product payload for any product (including inactive), with no HTTP cache:

- `price` and `priceWithoutDiscount` (MRP; `null` when not set)
- `description`, `stock`, CMS flags, `productFeatures`
- Full `images[]` (with `storageKey`)
- `woods[]` / `polishes[]` / `fabrics[]` with `priceAdjustment` and availability
- `subCategory` (+ parent category)
- `ratingAverage` / `reviewCount`
- `soldCount` — total pieces sold (sum of order-line quantities for orders that are not `PENDING` or `CANCELLED`)

### cURL

```bash
curl "http://localhost:5000/api/v1/admin/products/7" \
  -H "Authorization: Bearer $TOKEN"
```

Example fields unique to this admin response:

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Oak Dining Table",
    "price": "24999.99",
    "priceWithoutDiscount": "29999.99",
    "stock": 10,
    "soldCount": 42,
    "ratingAverage": 4.5,
    "reviewCount": 12
  }
}
```

`soldCount` is **not** included on public product detail or list endpoints.
---

## GET /api/v1/products/:idOrSlug

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns full product details for the storefront product page. Accepts either a **numeric product ID** or a **slug**. Only **active** products (`isActive=true`) are returned; hidden products respond with `404`. For admin edit screens prefer [`GET /admin/products/:id`](#get-apiv1adminproductsid).

| Path value | Lookup |
|------------|--------|
| Digits only (`7`) | By product ID |
| Slug (`oak-dining-table`) | By product slug |

### Examples

```http
GET /api/v1/products/7
GET /api/v1/products/oak-dining-table
```

### Success response `200`

Same shape as the create/update response: `description`, full `images` array, `productFeatures`, `woods` / `polishes` / `fabrics` (with `priceAdjustment`), `subCategory`, etc.

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Oak Dining Table",
    "slug": "oak-dining-table",
    "description": "Solid oak dining table for 6 people",
    "price": "24999.99",
    "priceWithoutDiscount": "29999.99",
    "stock": 10,
    "isActive": true,
    "isBestSeller": false,
    "isFeaturedProduct": true,
    "isMostPopular": false,
    "isNewArrival": true,
    "productFeatures": [
      "Solid oak wood",
      "Seats 6 people",
      "1-year warranty"
    ],
    "subCategoryId": 1,
    "subCategory": {
      "id": 1,
      "name": "Beds",
      "slug": "beds",
      "heading": "Beds",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom"
      }
    },
    "images": [
      {
        "id": 10,
        "url": "https://cdn.example.com/products/oak-table.jpg",
        "storageKey": "products/2026/07/8f3c2a1b.webp",
        "altText": "Oak dining table front view",
        "sortOrder": 0
      }
    ],
    "ratingAverage": 4.5,
    "reviewCount": 12,
    "createdAt": "2026-07-09T18:02:58.000Z",
    "updatedAt": "2026-07-09T18:02:58.000Z"
  }
}
```

### Errors

| Status | When |
|--------|------|
| `404` | Product not found or inactive |

### cURL

```bash
curl "http://localhost:5000/api/v1/products/7"
curl "http://localhost:5000/api/v1/products/oak-dining-table"
```

---

## GET /api/v1/products/filters

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Returns filter metadata for the storefront product listing page: active categories with nested sub-categories (and product counts), active-product price range, CMS tag options, and sort options.

Responses are cached in Redis (60s default) and invalidated when products or categories change.

### Example

```http
GET /api/v1/products/filters
```

### Success response `200`

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Bedroom",
        "slug": "bedroom",
        "productCount": 12,
        "subCategories": [
          {
            "id": 1,
            "name": "Beds",
            "slug": "beds",
            "productCount": 5
          }
        ]
      }
    ],
    "priceRange": {
      "min": 999,
      "max": 99999
    },
    "tags": [
      { "value": "isBestSeller", "label": "Best Seller", "productCount": 3 },
      { "value": "isFeaturedProduct", "label": "Featured", "productCount": 8 },
      { "value": "isMostPopular", "label": "Most Popular", "productCount": 4 },
      { "value": "isNewArrival", "label": "New Arrival", "productCount": 6 }
    ],
    "sortOptions": [
      { "value": "createdAt", "label": "Newest", "order": "desc" },
      { "value": "price", "label": "Price: Low to High", "order": "asc" }
    ]
  }
}
```

### cURL

```bash
curl "http://localhost:5000/api/v1/products/filters"
```

---

## GET /api/v1/products

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |

Paginated product catalogue for the storefront. Defaults to **active** products only (`isActive=true`).

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | — | Case-insensitive partial match |
| `slug` | string | — | Exact match |
| `minPrice` | number | — | `price >= minPrice` |
| `maxPrice` | number | — | `price <= maxPrice` |
| `subCategoryId` | integer | — | Filter by sub-category |
| `subCategorySlug` | string | — | Filter by sub-category slug (e.g. `beds`) |
| `categoryId` | integer | — | Filter by parent category |
| `categorySlug` | string | — | Filter by parent category slug (e.g. `bedroom`) |
| `isActive` | boolean | `true` | Use `false` for hidden products |
| `tag` | string | — | CMS tag filter: `isBestSeller` \| `isFeaturedProduct` \| `isMostPopular` \| `isNewArrival` |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `sortBy` | string | `createdAt` | `name` \| `price` \| `createdAt` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

### Example requests

```http
GET /api/v1/products?subCategoryId=1
GET /api/v1/products?categoryId=1
GET /api/v1/products?categorySlug=bedroom&subCategorySlug=beds
GET /api/v1/products?name=oak&page=1&limit=10
GET /api/v1/products?tag=isFeaturedProduct
GET /api/v1/products?tag=isBestSeller&limit=8
GET /api/v1/products?minPrice=1000&maxPrice=50000&sortBy=price&sortOrder=asc
```

### List item fields

| Field | Description |
|-------|-------------|
| `subCategoryId` | Sub-category ID |
| `subCategory` | Nested sub-category + parent category |
| `productFeatures` | Array of feature strings (empty array if none) |
| `customization` | Free-form `{ groupName, value, price, image }[]` (empty array if none) |
| `woods` / `polishes` / `fabrics` | Assigned customizations with `priceAdjustment` (list returns available only) |
| `isBestSeller` / `isFeaturedProduct` / `isMostPopular` / `isNewArrival` | CMS merchandising flags |
| `primaryImage` | Lowest `sortOrder` image, or `null` |

### cURL

```bash
curl "http://localhost:5000/api/v1/products?categorySlug=bedroom&page=1&limit=10"
curl "http://localhost:5000/api/v1/products?tag=isFeaturedProduct&limit=10"
```

---

## Quick workflow

```bash
export TOKEN="<accessToken>"

# 1. Get sub-categories
curl http://localhost:5000/api/v1/sub-categories?categoryId=1 -H "Authorization: Bearer $TOKEN"

# 2. Create product
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Oak Table","slug":"oak-table","price":15000,"stock":5,"subCategoryId":1,"productFeatures":["Solid wood","Easy assembly"]}'

# 3. List products in Bedroom category (public — no token)
curl "http://localhost:5000/api/v1/products?categoryId=1"
```
