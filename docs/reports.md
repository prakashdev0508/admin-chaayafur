# Reports and dashboard

Staff analytics: home dashboard (KPIs + charts), six filterable **report sections** (each with KPIs, charts, and a paginated table), and Excel (`.xlsx`) export.

[← Back to index](./README.md) · [Auth](./auth.md) · [Orders](./orders.md) · [Payments](./payments.md)

---

## Permissions

| Permission | Routes |
|------------|--------|
| `view-dashboard` | `GET /api/v1/admin/dashboard` |
| `view-reports` | `GET /api/v1/admin/reports/*` and `*/export` |

Seeded on the `ADMIN` role; `DASHBOARD` role has `view-dashboard` only.

All routes require a **staff JWT** (`@StaffOnly()`).

---

## Configuration

| Env | Default | Purpose |
|-----|---------|---------|
| `REPORT_TIMEZONE` | `Asia/Kolkata` | Calendar-day boundaries for KPIs and trend buckets |
| `REPORT_LOW_STOCK_THRESHOLD` | `5` | Products with `stock <= threshold` count as low stock |
| `REPORT_EXPORT_MAX_ROWS` | `50000` | Max rows per Excel export (HTTP `413` if exceeded) |

---

## Metric definitions

| Metric | Rule |
|--------|------|
| **Countable sale / revenue order** | `Payment.status = COMPLETED` and `Order.status` not in `PENDING`, `CANCELLED` |
| **Gross revenue** | Sum of `Order.totalAmount` for countable orders in range |
| **Units sold** | `OrderItem.quantity` on countable orders |
| **Pending orders (KPI)** | Current count where `Order.status = PENDING` |
| **Delivered / cancelled today** | Distinct orders with an `order_status_events` row for that status today (report timezone) |
| **New customers (today)** | `Customer.createdAt` in today’s window |
| **Inventory value** | `SUM(stock × price)` for active products |
| **Low stock** | Active products with `stock <= REPORT_LOW_STOCK_THRESHOLD` |
| **Average order value** | Gross revenue ÷ countable order count for the selected period |
| **Conversion rate** | Not included (no visitor/session analytics in backend) |

---

## Dashboard (home)

`GET /api/v1/admin/dashboard`

Returns `{ range, kpis, charts }` only (no table). See previous examples in Swagger.

**Query:** `createdFrom`, `createdTo` (default last 30 days), `granularity` (`daily` | `weekly` | `monthly`).

---

## Report sections (JSON)

Base path: `/api/v1/admin/reports`

### Response envelope (breaking change)

Each `GET` report returns:

```json
{
  "range": {
    "createdFrom": "2026-06-17",
    "createdTo": "2026-07-17",
    "timezone": "Asia/Kolkata",
    "granularity": "daily",
    "filters": { }
  },
  "kpis": { },
  "charts": { },
  "table": {
    "items": [ ],
    "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

**Migration:** Top-level `items` / `meta` are now under **`table`**. Orders no longer expose a separate `summary` array — use `charts.statusDistribution` and `kpis` counts.

**Inventory** uses `range.snapshot: true` (no date range; live stock snapshot). Other reports default to the **last 30 days** when `createdFrom` / `createdTo` are omitted.

**Query (common):** `createdFrom`, `createdTo`, `page`, `limit` (max 100), `granularity` where noted.

### Products — `GET .../products`

| Filters | `categoryId`, `subCategoryId`, `productId`, `search`, `isActive` |
| **kpis** | `totalProducts`, `activeProducts`, `unitsSold`, `grossRevenue`, `avgSellingPrice`, `topProduct` |
| **charts** | `topProducts`, `revenueByCategory`, `unitsTrend` |

### Sales — `GET .../sales`

| Filters | `categoryId`, `city`, `granularity` |
| **kpis** | `orderCount`, `grossRevenue`, `totalDiscount`, `totalShipping`, `refundsProcessed`, `netRevenue`, `averageOrderValue` |
| **charts** | `revenueByPeriod`, `ordersByPeriod`, `refundsByPeriod` |
| **table** | One row per period bucket (paginated) |

### Orders — `GET .../orders`

| Filters | `status`, `customerId`, `orderNumber`, `customerPhone`, `paymentStatus`, `city`, `granularity` |
| **kpis** | `totalOrders`, `grossRevenue`, `averageOrderValue`, `pendingCount`, `cancelledCount`, `deliveredCount` |
| **charts** | `statusDistribution`, `ordersTrend`, `revenueTrend` |

### Inventory — `GET .../inventory`

| Filters | `categoryId`, `lowStockOnly`, `outOfStockOnly`, `isActive` |
| **kpis** | `totalSkus`, `totalStockUnits`, `inventoryValue`, `lowStockCount`, `outOfStockCount` |
| **charts** | `stockValueByCategory`, `lowStockProducts`, `stockDistribution` |

### Customers — `GET .../customers`

| Filters | `hasOrderInRange`, `city`, `granularity` |
| **kpis** | `totalCustomers`, `newCustomers`, `customersWithOrders`, `repeatCustomers`, `totalSpent` |
| **charts** | `registrationsTrend`, `topCustomersBySpend`, `customersByCity` |

### Payments — `GET .../payments`

| Filters | `status`, `orderNumber`, `granularity` (dates on `Payment.createdAt`) |
| **kpis** | `paymentCount`, `totalAmount`, `completedAmount`, `failedCount`, `pendingCount`, `refundedAmount` |
| **charts** | `statusDistribution`, `amountByPeriod`, `methodDistribution` |

### Chart point shapes

- Trends: `{ "period": "<ISO datetime>", "value": number }`
- Named series: `{ "name": string, "value": number, "amount"?: string }`

---

## Excel export

Unchanged: `GET .../{section}/export` with the same filter query params (no pagination).

---

## Swagger

Tags: `admin-dashboard`, `admin-reports` — see `/api/docs`.
