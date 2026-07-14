# Site Settings API

Storefront branding, contact info, announcement bar, GSTIN, and shipping fee defaults.

[← Back to index](./README.md) · [Home / CMS](./home.md) · [Shipping](./shipping.md) · [Uploads](./uploads.md)

---

## Overview

- Singleton row (`id = 1`) — always exists after seed/migration
- **`GET /site-settings`** — public payload for the storefront (logo, contact, announcement, shipping fees)
- **Admin** — `GET` / `PUT /admin/site-settings` to read and partially update
- Upload logo/favicon via [uploads.md](./uploads.md), then save returned `url` + `key` on settings
- Announcement bar fields live on the same singleton (`announcementText`, `announcementLinkUrl`, `announcementIsActive`)
- Shipping fee fields (`flatShippingFee`, `freeShippingMinAmount`) are edited here; pincode allowlists are in [shipping.md](./shipping.md)

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /site-settings` | **Public** | — | — | — |
| `GET /admin/site-settings` | `view-settings` | Yes | Yes | No |
| `PUT /admin/site-settings` | `update-settings` | Yes | Yes | No |
| `POST /uploads/logo-images` | `update-settings` | Yes | Yes | No |
| `POST /uploads/favicon-images` | `update-settings` | Yes | Yes | No |

---

## GET /api/v1/site-settings

| | |
|---|---|
| **Auth** | Public — no Bearer token required |
| **Status** | `200` |
| **Cache** | Redis versioned body + `Cache-Control: public, max-age=0, s-maxage=60` |

### Success response

```json
{
  "success": true,
  "data": {
    "logoUrl": "https://cdn.example.com/branding/logo.webp",
    "faviconUrl": "https://cdn.example.com/branding/favicon.webp",
    "phone": "+919876543210",
    "email": "hello@chaayafurnitures.com",
    "whatsapp": "+919876543210",
    "showroomAddress": "12 MG Road, Bengaluru, Karnataka 560001",
    "businessHours": "Mon–Sat 10:00–19:00; Sun closed",
    "socialLinks": {
      "facebook": "https://facebook.com/chaaya",
      "instagram": "https://instagram.com/chaaya"
    },
    "gstin": "29AAAAA0000A1Z5",
    "announcement": {
      "text": "Free shipping on orders above ₹10,000 this week",
      "linkUrl": "/products?tag=isNewArrival",
      "isActive": true
    },
    "shipping": {
      "flatShippingFee": "499",
      "freeShippingMinAmount": "10000"
    }
  }
}
```

Storage keys are omitted from the public response.

### cURL

```bash
curl "http://localhost:5000/api/v1/site-settings"
```

---

## GET /api/v1/admin/site-settings

| | |
|---|---|
| **Auth** | Staff Bearer (`view-settings`) |
| **Status** | `200` |

Returns the full row including `logoStorageKey`, `faviconStorageKey`, and flat announcement fields.

---

## PUT /api/v1/admin/site-settings

| | |
|---|---|
| **Auth** | Staff Bearer (`update-settings`) |
| **Status** | `200` |
| **Body** | Partial — only send fields to change |

### Example body

```json
{
  "logoUrl": "https://cdn.example.com/branding/logo.webp",
  "logoStorageKey": "branding/logo/2026/07/uuid.webp",
  "phone": "+919876543210",
  "email": "hello@chaayafurnitures.com",
  "whatsapp": "+919876543210",
  "showroomAddress": "12 MG Road, Bengaluru, Karnataka 560001",
  "businessHours": "Mon–Sat 10:00–19:00; Sun closed",
  "socialLinks": {
    "instagram": "https://instagram.com/chaaya"
  },
  "gstin": "29AAAAA0000A1Z5",
  "announcementText": "Free shipping on orders above ₹10,000 this week",
  "announcementLinkUrl": "/products?tag=isNewArrival",
  "announcementIsActive": true,
  "flatShippingFee": 499,
  "freeShippingMinAmount": 10000
}
```

Set `freeShippingMinAmount` to `null` to disable the free-shipping threshold. Replacing logo/favicon with a new storage key deletes the previous R2 object when one was stored.

### cURL

```bash
curl -X PUT "http://localhost:5000/api/v1/admin/site-settings" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "announcementText": "Festive sale — extra 10% off",
    "announcementIsActive": true,
    "flatShippingFee": 499
  }'
```
