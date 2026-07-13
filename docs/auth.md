# Auth API

Staff authentication and authorization for the Chaaya Furnitures admin backend.

[← Back to index](./README.md) · [Customers (storefront)](./customers.md)

---

## Overview

- JWT Bearer token authentication for **staff** and **customers** (separate token types)
- Three staff roles: `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`
- Role and permission source of truth: `src/common/data/roles.ts`
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
| `role` | string | `SUPER_ADMIN`, `ADMIN`, or `ORDER_MANAGER` |
| `type` | string | Always `staff` |

```json
{
  "sub": 1,
  "email": "admin@chaaya.com",
  "role": "SUPER_ADMIN",
  "type": "staff",
  "iat": 1234567890,
  "exp": 1234567890
}
```

> All `id` fields in auth responses are **integers** (auto-increment). After a database reset or re-seed, log in again — old JWTs with outdated `sub` values will fail.

### Access control

1. **JwtAuthGuard** — valid JWT required on all routes except `@Public()`
2. **RolesGuard** — enforces `@Roles(...)` when set on a route
3. **PermissionsGuard** — enforces `@RequirePermissions(...)` when set on a route

### Staff roles

| Role | Value |
|------|-------|
| Super Admin | `SUPER_ADMIN` |
| Admin | `ADMIN` |
| Order Manager | `ORDER_MANAGER` |

---

## Endpoints

| Method | Endpoint | Auth | Access |
|--------|----------|------|--------|
| `POST` | `/api/v1/auth/login` | Public | Anyone |
| `GET` | `/api/v1/auth/roles-permissions` | Bearer | Any staff |
| `GET` | `/api/v1/auth/staff` | Bearer | `SUPER_ADMIN` only |
| `POST` | `/api/v1/auth/staff` | Bearer | `SUPER_ADMIN` + `create-staff` |

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

Returns the full roles and permissions map for frontend validation.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Status** | `200` |

### Request body

None.

### Success response

```json
{
  "success": true,
  "data": {
    "SUPER_ADMIN": {
      "label": "Super Admin",
      "permissions": ["all"]
    },
    "ADMIN": {
      "label": "Admin",
      "permissions": [
        "view-staff",
        "create-products",
        "update-products",
        "delete-products",
        "view-products",
        "create-categories",
        "update-categories",
        "delete-categories",
        "view-categories",
        "create-orders",
        "update-orders",
        "view-orders",
        "create-payments",
        "update-payments",
        "view-payments",
        "create-reports",
        "update-reports",
        "view-reports",
        "create-settings",
        "update-settings",
        "view-settings",
        "view-customers",
        "update-customers"
      ]
    },
    "ORDER_MANAGER": {
      "label": "Order Manager",
      "permissions": [
        "view-products",
        "view-categories",
        "view-orders",
        "update-orders",
        "view-payments",
        "view-customers"
      ]
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `401` | Missing or invalid token |

### cURL

```bash
curl http://localhost:5000/api/v1/auth/roles-permissions \
  -H "Authorization: Bearer $TOKEN"
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
| `role` | string | — | Filter by role: `SUPER_ADMIN`, `ADMIN`, or `ORDER_MANAGER` |
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
  "role": "ORDER_MANAGER"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email, must be unique |
| `password` | string | Yes | Min 6 characters |
| `firstName` | string | No | — |
| `lastName` | string | No | — |
| `role` | string | Yes | `ADMIN` or `ORDER_MANAGER` only |

> `SUPER_ADMIN` cannot be assigned via this API.

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | New staff user ID |
| `email` | string | Staff email |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name |
| `role` | string | Assigned role |
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
    "role": "ORDER_MANAGER",
    "isActive": true,
    "createdAt": "2026-07-09T15:40:07.100Z"
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Invalid payload |
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
    "role": "ORDER_MANAGER"
  }'
```

---

## Permissions reference

| Permission key | Description |
|----------------|-------------|
| `all` | Full access (`SUPER_ADMIN` only) |
| `create-staff` | Create staff users |
| `view-staff` | View staff users |
| `create-products` | Create products |
| `update-products` | Update products |
| `view-products` | List/view products |
| `create-categories` | Create categories |
| `update-categories` | Update categories |
| `view-categories` | View categories |
| `create-orders` | Create orders |
| `update-orders` | Update orders |
| `view-orders` | View orders |
| `create-payments` | Create payments |
| `update-payments` | Update payments |
| `view-payments` | View payments |
| `view-customers` | View customers |
| `update-customers` | Update customers |

Full list: `src/common/data/roles.ts` or `GET /api/v1/auth/roles-permissions`.

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
