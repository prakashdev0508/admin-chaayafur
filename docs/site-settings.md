# Site Settings API

Storefront branding, contact info, announcement bar, GSTIN / PAN / CIN, and shipping fee defaults.

[← Back to index](./README.md) · [Home / CMS](./home.md) · [Shipping](./shipping.md) · [Uploads](./uploads.md)

---

## Overview

- Singleton row (`id = 1`) — always exists after seed/migration
- **`GET /site-settings`** — public payload for the storefront (logo, contact, announcement, shipping fees)
- **Admin** — `GET` / `PUT /admin/site-settings` to read and partially update
- Upload logo/favicon via [uploads.md](./uploads.md), then save returned `url` + `key` on settings
- Announcement bar fields live on the same singleton (`announcementText`, `announcementLinkUrl`, `announcementIsActive`)
- Shipping fee fields (`flatShippingFee`, `freeShippingMinAmount`, `floorDeliveryChargePerFloor`) are edited here; pincode allowlists are in [shipping.md](./shipping.md)
- Login bonus fields (`loginBonusIsActive`, `loginBonusAmount`) are admin-only (not on public `GET /site-settings`). Default amount is **0** and inactive until an admin sets a positive amount and enables the feature. See [wallet.md](./wallet.md).
- Wallet redemption caps (`walletRedemptionMaxAmount`, `walletRedemptionMinOrderAmount`) are admin-only. Customers see the current caps on `GET /users/me/wallet`.

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
    "pan": "AABCF1234K",
    "cin": "U74999TG2020PTC123456",
    "announcement": {
      "text": "Free shipping on orders above ₹10,000 this week",
      "linkUrl": "/products?tag=isNewArrival",
      "isActive": true
    },
    "shipping": {
      "flatShippingFee": "499",
      "freeShippingMinAmount": "10000",
      "floorDeliveryChargePerFloor": "300"
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
  "pan": "AABCF1234K",
  "cin": "U74999TG2020PTC123456",
  "announcementText": "Free shipping on orders above ₹10,000 this week",
  "announcementLinkUrl": "/products?tag=isNewArrival",
  "announcementIsActive": true,
  "flatShippingFee": 499,
  "freeShippingMinAmount": 10000,
  "floorDeliveryChargePerFloor": 300,
  "loginBonusIsActive": true,
  "loginBonusAmount": 1000,
  "walletRedemptionMaxAmount": 1000,
  "walletRedemptionMinOrderAmount": 10000
}
```

Set `freeShippingMinAmount` to `null` to disable the free-shipping threshold. `floorDeliveryChargePerFloor` is the per-floor carry-up rate when lift access is not available (ground floor = ₹0; Nth floor = N × rate; waived when checkout `liftAccessAvailable` is true). Replacing logo/favicon with a new storage key deletes the previous R2 object when one was stored.

`loginBonusIsActive` + `loginBonusAmount` control the one-time OTP login wallet credit. Amount defaults to `0` — set a positive amount and enable the flag before any credits are sent. Turn `loginBonusIsActive` off to pause without clearing the amount.

`walletRedemptionMaxAmount` (default `1000`) is the max wallet INR redeemable per checkout order; set to `0` to disable redemption. `walletRedemptionMinOrderAmount` (default `10000`) is the minimum merchandise total after coupon required before wallet can be used. See [wallet.md](./wallet.md) and [orders.md](./orders.md).
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
