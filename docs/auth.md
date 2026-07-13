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

---

## GET /api/v1/auth/roles-permissions

Returns the full roles and permissions map for frontend validation.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Status** | `200` |
