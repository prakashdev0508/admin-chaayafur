# Current changes (newchange2)

Internal notes only — **not** registered in the documentation UI.

---

## 1. Customer profile APIs (`/users/me/*`)

Dedicated **customer-only** surface (separate from staff `/customers` and dual-mode `/orders`). All lookups use JWT `customer.id` only.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/users/me` | Enriched profile: phone, default address summary, counts (`addresses`, `orders`, `openTickets`, product/order reviews) |
| `GET` | `/users/me/orders` | List own orders |
| `GET` | `/users/me/orders/:orderId` | Own order detail (`404` if not owned) |
| `GET` | `/users/me/orders/:orderId/tracking` | Own order tracking |
| `GET` | `/users/me/tickets` | Cross-order list of own support tickets |
| `GET` | `/users/me/tickets/:ticketId` | Own ticket detail |
| `GET` | `/users/me/addresses` | Own addresses |
| `GET` | `/users/me/reviews` | Own product + order reviews |

**Files:** `src/modules/users/*`, plus helpers in `order-support` (list/count for customer).

---

## 2. Cloudflare R2 cleanup

### Product images
- On `PATCH` product with `images`, only delete R2 keys that are **removed** (`oldKeys − newKeys`), not every previous key.
- Product detail responses now include `storageKey` so staff UIs can round-trip kept images.
- Empty `images: []` still clears DB and deletes all previous stored keys.

### Invoice regenerate
- After uploading a new PDF, delete the previous object when `pdfStorageKey` is set.
- If `pdfStorageKey` is missing but `pdfUrl` exists, derive the key from the public base URL (best-effort) before orphaning.
- Delete failures are logged; new PDF URL still saved.

**Files:** `products.service.ts`, `r2-storage.service.ts` (`tryExtractKeyFromPublicUrl`), `invoices.service.ts`.

---

## 3. Product + order reviews

### Schema
- `Review` (product): added optional `orderId`, `isVisible` (default `true`); unique still `(customerId, productId)`.
- New `OrderReview`: one per order (`orderId` unique), `rating`, `comment?`, `isVisible`.
- Migration: `prisma/migrations/20260714183000_order_and_product_reviews/`.

### Rules
- Only for orders with status `DELIVERED`.
- Product review: product must be a line item on that owned order; create upserts.
- Order review: at most one per order; create updates if already exists.

### APIs
| Audience | Endpoints |
|----------|-----------|
| Customer | `POST/PATCH/DELETE /reviews/products`, `POST/PATCH/DELETE /reviews/orders`, `GET /users/me/reviews` |
| Public | `GET /products/:productId/reviews`; `GET /products/:id` includes `ratingAverage`, `reviewCount` |
| Staff | `GET /reviews`; `PATCH /reviews/products/:id/visibility`; `PATCH /reviews/orders/:id/visibility` |

### Permissions
- `view-reviews` — SUPER_ADMIN, ADMIN, ORDER_MANAGER
- `moderate-reviews` — SUPER_ADMIN, ADMIN

**Files:** `src/modules/reviews/*`, `roles.ts`, `products` rating enrichment.

---

## 4. Docs (UI-registered)

- New: `documentation/reviews.md` (also added to docs UI nav)
- Updated: `customers.md`, `products.md`, `invoices.md`, `README.md`

---

## Apply DB migration

```bash
npx prisma migrate deploy
```
