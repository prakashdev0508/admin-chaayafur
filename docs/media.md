# Media API

Admin-managed media vendors and media items (press / editorial coverage), plus public storefront lists.

[← Back to index](./README.md) · [Uploads](./uploads.md)

---

## Overview

- Create a **media vendor** first (name, image, optional description)
- Then create **media items** linked to that vendor (`link`, cover image, description — all required)
- Coverage items support **`showOnHome`** (`true`/`false`) — when true and active, they appear in `GET /home` as `mediaCoverage`
- **`sortOrder`** auto-assigns to `max+1` on create when the frontend omits it (vendors and items)
- Images: upload via [uploads.md](./uploads.md), then attach `url` + optional `storageKey` on create/update
- Hide with `isActive: false`, or permanently remove with `DELETE`
- Deleting a vendor fails while media items are still attached
- Public lists return **active** records only (items also require an active vendor)

### Admin addition flow

```text
1. POST /uploads/media-vendor-images  →  { url, key }
2. POST /admin/media/vendors          →  vendor
3. POST /uploads/media-images         →  { url, key }
4. POST /admin/media                  →  media item (vendorId + link + cover + description)
```

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /media/vendors` | **Public** | — | — | — |
| `GET /media` | **Public** | — | — | — |
| `POST /uploads/media-vendor-images` | `create-media` **or** `update-media` | Yes | Yes | No |
| `POST /uploads/media-images` | `create-media` **or** `update-media` | Yes | Yes | No |
| `POST /admin/media/vendors` | `create-media` | Yes | Yes | No |
| `GET /admin/media/vendors` | `view-media` | Yes | Yes | No |
| `GET /admin/media/vendors/:id` | `view-media` | Yes | Yes | No |
| `PATCH /admin/media/vendors/:id` | `update-media` | Yes | Yes | No |
| `DELETE /admin/media/vendors/:id` | `delete-media` | Yes | Yes | No |
| `POST /admin/media` | `create-media` | Yes | Yes | No |
| `GET /admin/media` | `view-media` | Yes | Yes | No |
| `GET /admin/media/:id` | `view-media` | Yes | Yes | No |
| `PATCH /admin/media/:id` | `update-media` | Yes | Yes | No |
| `DELETE /admin/media/:id` | `delete-media` | Yes | Yes | No |

`SUPER_ADMIN` has `all`. `ADMIN` is seeded with the four `*-media` permissions.

---

## Public

### GET /api/v1/media/vendors

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |
| **Cache** | `Cache-Control: public, max-age=0, s-maxage=60` |

Active vendors ordered by `sortOrder ASC`, then `id ASC`. Response includes **`name` and `imageUrl` only**.

```bash
curl "http://localhost:5000/api/v1/media/vendors"
```

```json
{
  "success": true,
  "data": [
    {
      "name": "Architectural Digest",
      "imageUrl": "https://cdn.example.com/media/vendors/logo.webp"
    }
  ]
}
```

### GET /api/v1/media

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |
| **Cache** | `Cache-Control: public, max-age=0, s-maxage=60` |

| Param | Type | Description |
|-------|------|-------------|
| `vendorId` | number | Optional filter by vendor |

Active media items (vendor must also be active), ordered by `sortOrder ASC`, then `id ASC`.

```bash
curl "http://localhost:5000/api/v1/media?vendorId=1"
```

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "link": "https://example.com/articles/chaaya-feature",
      "coverImageUrl": "https://cdn.example.com/media/items/cover.webp",
      "description": "Chaaya featured in the summer living special",
      "sortOrder": 0,
      "vendor": {
        "id": 1,
        "name": "Architectural Digest",
        "imageUrl": "https://cdn.example.com/media/vendors/logo.webp"
      }
    }
  ]
}
```

---

## Uploads

1. `POST /api/v1/uploads/media-vendor-images` — vendor logo/image → keys like `media/vendors/{year}/{month}/{uuid}.webp`
2. `POST /api/v1/uploads/media-images` — media cover image → keys like `media/items/{year}/{month}/{uuid}.webp`

```bash
curl -X POST http://localhost:5000/api/v1/uploads/media-vendor-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/vendor.jpg"

curl -X POST http://localhost:5000/api/v1/uploads/media-images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/cover.jpg"
```

Use returned `url` / `key` as `imageUrl` + `imageStorageKey` (vendors) or `coverImageUrl` + `coverImageStorageKey` (items).

---

## Admin media vendors

### POST /api/v1/admin/media/vendors

| | |
|---|---|
| **Auth** | Bearer staff JWT + `create-media` |
| **Status** | `201` |

```json
{
  "name": "Architectural Digest",
  "description": "Featured press and editorial coverage",
  "imageUrl": "https://cdn.example.com/media/vendors/logo.webp",
  "imageStorageKey": "media/vendors/2026/11/uuid.webp",
  "sortOrder": 0,
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Max 120 |
| `description` | string | No | Max 2000 |
| `imageUrl` | string (URL) | Yes | From upload |
| `imageStorageKey` | string | No | R2 `key` from upload |
| `sortOrder` | integer | No | Auto `max+1` when omitted (lower first) |
| `isActive` | boolean | No | Default `true` |

### GET /api/v1/admin/media/vendors

| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Case-insensitive contains search |
| `isActive` | boolean | Filter by active status |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

Response items include `mediaItemsCount`, `imageStorageKey`, timestamps.

### GET /api/v1/admin/media/vendors/:id

| **Auth** | Bearer + `view-media` |

### PATCH /api/v1/admin/media/vendors/:id

Partial update. When replacing an image, send new `imageUrl` **and** `imageStorageKey` — previous R2 object is deleted only if the key changes. Hide with `{ "isActive": false }`.

### DELETE /api/v1/admin/media/vendors/:id

| | |
|---|---|
| **Auth** | Bearer + `delete-media` |
| **Status** | `204` |

Fails with `409` if media items are still attached. Deletes vendor image from R2 when `imageStorageKey` is set.

```bash
curl -X DELETE http://localhost:5000/api/v1/admin/media/vendors/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Admin media items

### POST /api/v1/admin/media

| | |
|---|---|
| **Auth** | Bearer staff JWT + `create-media` |
| **Status** | `201` |

```json
{
  "vendorId": 1,
  "link": "https://example.com/articles/chaaya-feature",
  "coverImageUrl": "https://cdn.example.com/media/items/cover.webp",
  "coverImageStorageKey": "media/items/2026/11/uuid.webp",
  "description": "Chaaya featured in the summer living special",
  "showOnHome": true,
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vendorId` | integer | Yes | Must exist |
| `link` | string (URL) | Yes | External media URL |
| `coverImageUrl` | string (URL) | Yes | From upload |
| `coverImageStorageKey` | string | No | R2 `key` from upload |
| `description` | string | Yes | Max 2000 |
| `showOnHome` | boolean | No | Default `false` — include on `GET /home` |
| `sortOrder` | integer | No | Auto `max+1` when omitted |
| `isActive` | boolean | No | Default `true` |

### GET /api/v1/admin/media

| Param | Type | Description |
|-------|------|-------------|
| `vendorId` | number | Filter by vendor |
| `isActive` | boolean | Filter by active status |
| `showOnHome` | boolean | Filter home-featured coverage |
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `100` |

Items include nested `vendor` summary (`id`, `name`, `imageUrl`).

### GET /api/v1/admin/media/:id

| **Auth** | Bearer + `view-media` |

### PATCH /api/v1/admin/media/:id

Partial update. Replacing cover: send new URL **and** storage key. Toggle home with `{ "showOnHome": true }` / `false`. Hide with `{ "isActive": false }`.

### DELETE /api/v1/admin/media/:id

| | |
|---|---|
| **Auth** | Bearer + `delete-media` |
| **Status** | `204` |

Permanently deletes the item and removes R2 cover when `coverImageStorageKey` is set.

```bash
curl -X DELETE http://localhost:5000/api/v1/admin/media/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Admin UI mapping

| Screen | Endpoints |
|--------|-----------|
| Vendors list | `GET /admin/media/vendors` |
| Create vendor | upload → `POST /admin/media/vendors` |
| Edit / hide vendor | `PATCH /admin/media/vendors/:id` |
| Delete vendor | `DELETE /admin/media/vendors/:id` |
| Media list | `GET /admin/media` |
| Create media | upload → `POST /admin/media` |
| Edit / hide media | `PATCH /admin/media/:id` |
| Delete media | `DELETE /admin/media/:id` |
| Storefront vendors | `GET /media/vendors` |
| Storefront media | `GET /media` |
