# Auth API

Staff authentication and authorization for the Chaaya Furnitures admin backend.

[← Back to index](./README.md) · [Customers (storefront)](./customers.md)

---

## Overview

- JWT Bearer token authentication for **staff** and **customers** (separate token types)
- **Dynamic RBAC** — roles and permissions live in the database (`roles`, `role_permissions`)
- Super Admin can create custom roles and assign permissions from a fixed catalog
- Three **system** default roles (seeded, non-deletable): `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`
- Permission key catalog (assignable values): `src/common/data/roles.ts` → `PERMISSIONS`
- Customer auth (register/login) is documented in [customers.md](./customers.md)

### JWT configuration

| Setting | Env variable | Default |
|---------|--------------|---------|
| Secret | `JWT_SECRET` | required |
| Expiry | `JWT_EXPIRES_IN` | `7d` |

### JWT payload

| Field | Type | Description |
|-------|------|-------------|
| `sub` | integer | Staff user ID |
| `email` | string | Staff email |
| `role` | string | Role **slug** (system or custom) |
| `roleId` | integer | Role ID |
| `type` | string | Always `staff` |

```json
{
  "sub": 1,
  "email": "admin@chaaya.com",
  "role": "SUPER_ADMIN",
  "roleId": 1,
  "type": "staff",
  "iat": 1234567890,
  "exp": 1234567890
}
```

> Authz uses permissions loaded from DB on each request (not only the JWT). After a role permission change, existing tokens pick it up immediately.

### Access control

1. **JwtAuthGuard** — valid JWT required on all routes except `@Public()`
2. **RolesGuard** — `@StaffOnly()` (any staff) or `@Roles('SUPER_ADMIN')` (system slug match)
3. **PermissionsGuard** — `@RequirePermissions(...)` checks the staff user’s effective permission list

### Default system roles

| Slug | Name | Notes |
|------|------|-------|
| `SUPER_ADMIN` | Super Admin | `all` permission; locked — cannot delete or edit permissions |
| `ADMIN` | Admin | All concrete permissions except staff CRUD; system role (non-deletable); permissions editable |
| `ORDER_MANAGER` | Order Manager | Orders / customers / support focused; system role; permissions editable |

---

## Endpoints

| Method | Endpoint | Auth | Access |
|--------|----------|------|--------|
| `POST` | `/api/v1/auth/login` | Public | Anyone |
| `GET` | `/api/v1/auth/roles-permissions` | Bearer | Any staff |
| `GET` | `/api/v1/auth/permissions` | Bearer | `SUPER_ADMIN` |
| `GET` | `/api/v1/auth/roles` | Bearer | `SUPER_ADMIN` |
| `GET` | `/api/v1/auth/roles/:id` | Bearer | `SUPER_ADMIN` |
| `POST` | `/api/v1/auth/roles` | Bearer | `SUPER_ADMIN` |
| `PATCH` | `/api/v1/auth/roles/:id` | Bearer | `SUPER_ADMIN` |
| `DELETE` | `/api/v1/auth/roles/:id` | Bearer | `SUPER_ADMIN` |
| `GET` | `/api/v1/auth/staff/me` | Bearer | Any staff |
| `GET` | `/api/v1/auth/staff/me/permissions` | Bearer | Any staff |
| `PATCH` | `/api/v1/auth/staff/me` | Bearer | Any staff |
| `PATCH` | `/api/v1/auth/staff/me/password` | Bearer | Any staff |
| `GET` | `/api/v1/auth/staff` | Bearer | `SUPER_ADMIN` only |
| `POST` | `/api/v1/auth/staff` | Bearer | `SUPER_ADMIN` + `create-staff` |
| `GET` | `/api/v1/auth/staff/:id` | Bearer | `SUPER_ADMIN` only |
| `PATCH` | `/api/v1/auth/staff/:id` | Bearer | `SUPER_ADMIN` only |
| `PATCH` | `/api/v1/auth/staff/:id/password` | Bearer | `SUPER_ADMIN` only |

---

## POST /api/v1/auth/login

Staff login. Returns JWT access token.

| | |
|---|---|
| **Auth** | Public |
| **Status** | `200` |

### Request body

```json
{
  "email": "admin@chaaya.com",
  "password": "change-me-admin"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 6 characters |

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Staff user ID |
| `email` | string | Staff email |
| `role` | string | Staff role |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name |

### Success response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@chaaya.com",
      "role": "SUPER_ADMIN",
      "firstName": "Super",
      "lastName": "Admin"
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Invalid payload |
| `401` | Invalid email or password |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chaaya.com","password":"change-me-admin"}'
```

---

## GET /api/v1/auth/roles-permissions

Returns all roles from the DB keyed by slug (includes custom roles).

| | |
|---|---|
| **Auth** | Bearer (any staff) |
| **Status** | `200` |

Each entry: `{ id, label, description, isSystem, permissions[] }`.

```bash
curl http://localhost:5000/api/v1/auth/roles-permissions \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## Role management (SUPER_ADMIN)

### GET /api/v1/auth/permissions

Assignable permission catalog (excludes reserved `all`).

### GET /api/v1/auth/roles

List all roles with `permissions` and `staffCount`.

### GET /api/v1/auth/roles/:id

Role detail.

### POST /api/v1/auth/roles

Create a custom role.

```json
{
  "name": "Warehouse Manager",
  "slug": "WAREHOUSE_MANAGER",
  "description": "Can view and update orders",
  "permissions": ["view-orders", "update-orders", "view-products"]
}
```

### PATCH /api/v1/auth/roles/:id

Update `name`, `description`, and/or replace `permissions`.  
Cannot change permissions on `SUPER_ADMIN`. System roles cannot be deleted but `ADMIN` / `ORDER_MANAGER` permissions can be edited.

### DELETE /api/v1/auth/roles/:id

Delete a **non-system** role with zero staff assigned.

```bash
curl -X POST http://localhost:5000/api/v1/auth/roles \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Warehouse Manager","slug":"WAREHOUSE_MANAGER","permissions":["view-orders","update-orders"]}'
```

---

## GET /api/v1/auth/staff

List staff users with pagination and optional filters. Restricted to Super Admin only.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Role** | `SUPER_ADMIN` |
| **Status** | `200` |

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number (min 1) |
| `limit` | integer | `10` | Items per page (1–100) |
| `roleId` | integer | — | Filter by role ID |
| `roleSlug` | string | — | Filter by role slug (e.g. `ORDER_MANAGER`) |
| `isActive` | boolean | — | Filter by active status |
| `email` | string | — | Partial email match (case-insensitive) |

### Response fields

Each item in `items`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Staff user ID |
| `email` | string | Staff email |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name |
| `role` | string | Staff role |
| `isActive` | boolean | Account status |
| `createdBy` | integer \| null | ID of staff user who created this account |
| `creator` | object \| null | Creator details (`id`, `email`, `firstName`, `lastName`) |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

`meta` contains `page`, `limit`, `total`, and `totalPages`.

### Success response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 2,
        "email": "manager@chaaya.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "ORDER_MANAGER",
        "isActive": true,
        "createdBy": 1,
        "creator": {
          "id": 1,
          "email": "admin@chaaya.com",
          "firstName": "Super",
          "lastName": "Admin"
        },
        "createdAt": "2026-07-09T15:40:07.100Z",
        "updatedAt": "2026-07-09T15:40:07.100Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | Not `SUPER_ADMIN` |

### cURL

```bash
curl "http://localhost:5000/api/v1/auth/staff?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## POST /api/v1/auth/staff

Create a new staff user. Restricted to Super Admin only.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Role** | `SUPER_ADMIN` |
| **Permission** | `create-staff` |
| **Status** | `201` |

### Request body

```json
{
  "email": "manager@chaaya.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": 3
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email, must be unique |
| `password` | string | Yes | Min 6 characters |
| `firstName` | string | No | — |
| `lastName` | string | No | — |
| `roleId` | integer | Yes | Existing role ID; cannot be `SUPER_ADMIN` |

> `SUPER_ADMIN` cannot be assigned via this API. Use `GET /auth/roles` to resolve IDs.

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | New staff user ID |
| `email` | string | Staff email |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name |
| `roleId` | integer | Assigned role ID |
| `role` / `roleSlug` | string | Role slug |
| `roleName` | string | Role display name |
| `permissions` | string[] | Effective permissions |
| `isActive` | boolean | Account status |
| `createdAt` | string | ISO timestamp |

### Success response

```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "manager@chaaya.com",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": 3,
    "role": "ORDER_MANAGER",
    "roleSlug": "ORDER_MANAGER",
    "roleName": "Order Manager",
    "isActive": true,
    "createdAt": "2026-07-09T15:40:07.100Z"
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Invalid payload / SUPER_ADMIN roleId |
| `401` | Missing or invalid token |
| `403` | Not `SUPER_ADMIN` or missing `create-staff` permission |
| `409` | Email already in use |

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/auth/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@chaaya.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": 3
  }'
```

---

## GET /api/v1/auth/staff/me

Current staff profile plus activity stats. Available to any staff role.

| | |
|---|---|
| **Auth** | Bearer (staff JWT) |
| **Status** | `200` |

### Response extras — `stats`

| Field | Description |
|-------|-------------|
| `ordersConfirmed` | Status events `CONFIRMED` recorded by this staff |
| `ordersShipped` | Status events `SHIPPED` |
| `ordersDelivered` | Status events `DELIVERED` |
| `ordersCancelled` | Status events `CANCELLED` |
| `refundsInitiatedStatus` | Status events `REFUND_INITIATED` |
| `refundsInitiated` | Refund rows this staff initiated |
| `refundsCompleted` | Refund rows this staff completed (clicked Complete) |
| `refundsProcessedAmount` | Sum of amounts for `PROCESSED` refunds they completed |

Also returns profile fields: `id`, `email`, `firstName`, `lastName`, `role`, `isActive`, `createdBy`, `creator`, timestamps.

```bash
curl http://localhost:5000/api/v1/auth/staff/me \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## GET /api/v1/auth/staff/me/permissions

Permissions for the logged-in staff user (derived from their role).

| | |
|---|---|
| **Auth** | Bearer (staff JWT) |
| **Status** | `200` |

### Success response

```json
{
  "success": true,
  "data": {
    "roleId": 2,
    "role": "ADMIN",
    "roleSlug": "ADMIN",
    "permissions": ["create-products", "update-products", "view-orders"]
  }
}
```

| Field | Description |
|-------|-------------|
| `roleId` | Current role ID |
| `role` / `roleSlug` | Role slug |
| `permissions` | Effective permission keys (`SUPER_ADMIN` includes `all` plus every concrete permission) |

```bash
curl http://localhost:5000/api/v1/auth/staff/me/permissions \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

---

## PATCH /api/v1/auth/staff/me

Update own `firstName` / `lastName` only.

```json
{ "firstName": "Jane", "lastName": "Smith" }
```

---

## PATCH /api/v1/auth/staff/me/password

Change own password. Requires the current password.

```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePassword123"
}
```

| Status | When |
|--------|------|
| `401` | Current password incorrect |
| `400` | New password same as current |

---

## GET /api/v1/auth/staff/:id

Staff detail + activity stats. **SUPER_ADMIN only.** Same response shape as `/auth/staff/me`.

---

## PATCH /api/v1/auth/staff/:id

Update another staff user’s `firstName`, `lastName`, `roleId` (any role except `SUPER_ADMIN`), or `isActive`. **SUPER_ADMIN only.**

Rules:
- Cannot change your own role or deactivate yourself
- Cannot change role of a `SUPER_ADMIN` account

```json
{
  "firstName": "John",
  "isActive": true,
  "roleId": 2
}
```

---

## PATCH /api/v1/auth/staff/:id/password

Admin password reset (no current password). **SUPER_ADMIN only.** Cannot reset your own password here — use `/auth/staff/me/password`.

```json
{ "newPassword": "temporaryPassword123" }
```

---

## Permissions reference

| Permission key | Description |
|----------------|-------------|
| `all` | Full access (`SUPER_ADMIN` only; implies every permission below) |
| `create-staff` | Create staff users (`SUPER_ADMIN` only) |
| `update-staff` | Update other staff users (`SUPER_ADMIN` only) |
| `delete-staff` | Delete staff users (`SUPER_ADMIN` only) |
| `view-staff` | View staff users (`SUPER_ADMIN` only) |
| `create-products` | Create products |
| `update-products` | Update products |
| `delete-products` | Delete products |
| `view-products` | List/view products |
| `create-categories` | Create categories / sub-categories |
| `update-categories` | Update categories / sub-categories |
| `delete-categories` | Delete categories |
| `view-categories` | View categories |
| `create-orders` | Create orders (staff) |
| `update-orders` | Update orders / regenerate invoices |
| `view-orders` | View orders and order audit logs |
| `create-payments` | Create payments |
| `update-payments` | Update payments / process refunds |
| `view-payments` | View payments |
| `create-reports` | Create reports |
| `update-reports` | Update reports |
| `view-reports` | View reports |
| `create-settings` | Create site settings |
| `update-settings` | Update site settings / shipping pincodes / logo uploads |
| `view-settings` | View site settings / shipping pincodes |
| `view-customers` | View customers |
| `update-customers` | Create/update/block customers and addresses |
| `create-coupons` | Create coupons |
| `update-coupons` | Update coupons |
| `view-coupons` | View coupons |
| `view-order-support` | View order support tickets |
| `update-order-support` | Reply to / update support tickets |
| `create-banners` | Create home banners |
| `update-banners` | Update home banners |
| `view-banners` | View home banners (admin) |
| `view-reviews` | List product/order reviews (staff) |
| `moderate-reviews` | Show/hide reviews |

Full list: `GET /api/v1/auth/permissions` (catalog) or `GET /api/v1/auth/roles-permissions` (per-role map). Permission keys are defined in `src/common/data/roles.ts`.

---

## Bootstrap super admin

Set in `.env` and run seed:

```env
SUPER_ADMIN_EMAIL=admin@chaaya.com
SUPER_ADMIN_PASSWORD=change-me-admin
```

```bash
npm run prisma:seed
```
