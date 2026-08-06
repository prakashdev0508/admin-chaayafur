# Shipping API

Pincode serviceability, shipping fee quotes, and floor delivery carry-up charges. Flat fee, free-shipping threshold, and per-floor rate come from [site settings](./site-settings.md).

[← Back to index](./README.md) · [Site Settings](./site-settings.md) · [Orders](./orders.md)

---

## Overview

- **Fee formula**
  - If `freeShippingMinAmount` is set and cart (after discount) ≥ threshold → `shippingAmount = 0`
  - Else → `shippingAmount = flatShippingFee` from site settings
- **Floor delivery**
  - `floorDeliveryAmount = deliveryFloor × floorDeliveryChargePerFloor`
  - Ground floor (`deliveryFloor = 0`) → ₹0
  - Not waived by free shipping
- **Pincode policy**
  - If the allowlist table is **empty** → all valid 6-digit Indian pincodes are serviceable
  - If any rows exist → only pincodes with `isServiceable: true` are allowed
- Checkout (`POST /orders`) validates the shipping address `zipCode` and adds `shippingAmount` + `floorDeliveryAmount` to the order total

### Who can access?

| Endpoint | Permission | SUPER_ADMIN | ADMIN | ORDER_MANAGER |
|----------|------------|:-----------:|:-----:|:-------------:|
| `GET /shipping/quote` | **Public** | — | — | — |
| `GET /admin/shipping/pincodes` | `view-settings` | Yes | Yes | No |
| `POST /admin/shipping/pincodes` | `update-settings` | Yes | Yes | No |
| `DELETE /admin/shipping/pincodes/:pincode` | `update-settings` | Yes | Yes | No |

---

## GET /api/v1/shipping/quote

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |
| **Query** | `pincode` (6-digit), `subtotal` (INR after discount), `deliveryFloor` (optional, default `0`) |

### Success response (serviceable)

```json
{
  "success": true,
  "data": {
    "pincode": "560001",
    "serviceable": true,
    "shippingAmount": "499",
    "deliveryFloor": 3,
    "floorDeliveryChargePerFloor": "300",
    "floorDeliveryAmount": "900",
    "message": "Shipping fee applies"
  }
}
```

### Success response (not serviceable)

```json
{
  "success": true,
  "data": {
    "pincode": "999999",
    "serviceable": false,
    "shippingAmount": "0",
    "deliveryFloor": 0,
    "floorDeliveryChargePerFloor": "300",
    "floorDeliveryAmount": "0",
    "message": "Delivery is not available for pincode 999999"
  }
}
```

### cURL

```bash
curl "http://localhost:5000/api/v1/shipping/quote?pincode=560001&subtotal=15000&deliveryFloor=3"
```

---

## GET /api/v1/admin/shipping/pincodes

| | |
|---|---|
| **Auth** | Staff Bearer (`view-settings`) |
| **Query** | `isServiceable`, `search`, `page`, `limit` |

---

## POST /api/v1/admin/shipping/pincodes

Bulk upsert pincodes.

```json
{
  "pincodes": ["560001", "560002", "400001"],
  "isServiceable": true
}
```

Status: `201`

---

## DELETE /api/v1/admin/shipping/pincodes/:pincode

Removes a pincode from the table. Status: `200`.

When the table becomes empty again, all valid Indian pincodes are treated as serviceable.
