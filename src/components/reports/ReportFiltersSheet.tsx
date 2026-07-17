import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ACTIVE_FILTER_ITEMS,
  ORDER_STATUS_FILTER_ITEMS,
  PAYMENT_STATUS_FILTER_ITEMS,
} from "@/lib/select-items";
import type {
  CustomersReportFilters,
  InventoryReportFilters,
  OrdersReportFilters,
  PaymentsReportFilters,
  ProductReportFilters,
  SalesReportFilters,
} from "@/lib/report-filters";
import type { ReportKind } from "@/types/reports";

const GRANULARITY_ITEMS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function GranularityField({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="report-granularity">Granularity</Label>
      <Select
        name="granularity"
        defaultValue={defaultValue}
        items={GRANULARITY_ITEMS}
      >
        <SelectTrigger id="report-granularity" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITY_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type ReportFiltersSheetProps = {
  kind: ReportKind;
  activeCount: number;
  productFilters: ProductReportFilters;
  salesFilters: SalesReportFilters;
  ordersFilters: OrdersReportFilters;
  inventoryFilters: InventoryReportFilters;
  customersFilters: CustomersReportFilters;
  paymentsFilters: PaymentsReportFilters;
  onApplyProduct: (filters: ProductReportFilters) => void;
  onApplySales: (filters: SalesReportFilters) => void;
  onApplyOrders: (filters: OrdersReportFilters) => void;
  onApplyInventory: (filters: InventoryReportFilters) => void;
  onApplyCustomers: (filters: CustomersReportFilters) => void;
  onApplyPayments: (filters: PaymentsReportFilters) => void;
};

function DateRangeFields({
  createdFrom,
  createdTo,
}: {
  createdFrom: string;
  createdTo: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="report-created-from">From</Label>
        <Input
          id="report-created-from"
          name="createdFrom"
          type="date"
          defaultValue={createdFrom}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-created-to">To</Label>
        <Input
          id="report-created-to"
          name="createdTo"
          type="date"
          defaultValue={createdTo}
        />
      </div>
    </>
  );
}

export function ReportFiltersSheet({
  kind,
  activeCount,
  productFilters,
  salesFilters,
  ordersFilters,
  inventoryFilters,
  customersFilters,
  paymentsFilters,
  onApplyProduct,
  onApplySales,
  onApplyOrders,
  onApplyInventory,
  onApplyCustomers,
  onApplyPayments,
}: ReportFiltersSheetProps) {
  const titles: Record<ReportKind, string> = {
    products: "Product report filters",
    sales: "Sales report filters",
    orders: "Orders report filters",
    inventory: "Inventory report filters",
    customers: "Customer report filters",
    payments: "Payments report filters",
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline">
            <Filter className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-md bg-primary/10 px-1.5 text-xs text-primary">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{titles[kind]}</SheetTitle>
          <SheetDescription>
            Date filters use the report timezone (Asia/Kolkata by default).
          </SheetDescription>
        </SheetHeader>
        <form
          key={kind}
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);

            if (kind === "products") {
              onApplyProduct({
                createdFrom: String(data.get("createdFrom") ?? ""),
                createdTo: String(data.get("createdTo") ?? ""),
                granularity: String(data.get("granularity") ?? "daily") as
                  | "daily"
                  | "weekly"
                  | "monthly",
                search: String(data.get("search") ?? ""),
                categoryId: String(data.get("categoryId") ?? ""),
                isActive: String(data.get("isActive") ?? "all") as
                  | "all"
                  | "true"
                  | "false",
              });
              return;
            }

            if (kind === "sales") {
              onApplySales({
                createdFrom: String(data.get("createdFrom") ?? ""),
                createdTo: String(data.get("createdTo") ?? ""),
                granularity: String(data.get("granularity") ?? "daily") as
                  | "daily"
                  | "weekly"
                  | "monthly",
                categoryId: String(data.get("categoryId") ?? ""),
                city: String(data.get("city") ?? ""),
              });
              return;
            }

            if (kind === "orders") {
              onApplyOrders({
                createdFrom: String(data.get("createdFrom") ?? ""),
                createdTo: String(data.get("createdTo") ?? ""),
                granularity: String(data.get("granularity") ?? "daily") as
                  | "daily"
                  | "weekly"
                  | "monthly",
                status: String(data.get("status") ?? "all") as OrdersReportFilters["status"],
                customerId: String(data.get("customerId") ?? ""),
                orderNumber: String(data.get("orderNumber") ?? ""),
                customerPhone: String(data.get("customerPhone") ?? ""),
                paymentStatus: String(data.get("paymentStatus") ?? "all") as OrdersReportFilters["paymentStatus"],
                city: String(data.get("city") ?? ""),
              });
              return;
            }

            if (kind === "inventory") {
              onApplyInventory({
                categoryId: String(data.get("categoryId") ?? ""),
                lowStockOnly: data.get("lowStockOnly") === "on",
                outOfStockOnly: data.get("outOfStockOnly") === "on",
                isActive: String(data.get("isActive") ?? "all") as
                  | "all"
                  | "true"
                  | "false",
              });
              return;
            }

            if (kind === "customers") {
              onApplyCustomers({
                createdFrom: String(data.get("createdFrom") ?? ""),
                createdTo: String(data.get("createdTo") ?? ""),
                granularity: String(data.get("granularity") ?? "daily") as
                  | "daily"
                  | "weekly"
                  | "monthly",
                hasOrderInRange: data.get("hasOrderInRange") === "on",
                city: String(data.get("city") ?? ""),
              });
              return;
            }

            onApplyPayments({
              createdFrom: String(data.get("createdFrom") ?? ""),
              createdTo: String(data.get("createdTo") ?? ""),
              granularity: String(data.get("granularity") ?? "daily") as
                | "daily"
                | "weekly"
                | "monthly",
              status: String(data.get("status") ?? "all") as PaymentsReportFilters["status"],
              orderNumber: String(data.get("orderNumber") ?? ""),
            });
          }}
        >
          {kind !== "inventory" && (
            <DateRangeFields
              createdFrom={
                kind === "products"
                  ? productFilters.createdFrom
                  : kind === "sales"
                    ? salesFilters.createdFrom
                    : kind === "orders"
                      ? ordersFilters.createdFrom
                      : kind === "customers"
                        ? customersFilters.createdFrom
                        : paymentsFilters.createdFrom
              }
              createdTo={
                kind === "products"
                  ? productFilters.createdTo
                  : kind === "sales"
                    ? salesFilters.createdTo
                    : kind === "orders"
                      ? ordersFilters.createdTo
                      : kind === "customers"
                        ? customersFilters.createdTo
                        : paymentsFilters.createdTo
              }
            />
          )}

          {kind === "products" && (
            <>
              <GranularityField defaultValue={productFilters.granularity} />
              <div className="space-y-2">
                <Label htmlFor="product-search">Search</Label>
                <Input
                  id="product-search"
                  name="search"
                  defaultValue={productFilters.search}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Category ID</Label>
                <Input
                  id="product-category"
                  name="categoryId"
                  defaultValue={productFilters.categoryId}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-active">Active</Label>
                <Select
                  name="isActive"
                  defaultValue={productFilters.isActive}
                  items={ACTIVE_FILTER_ITEMS}
                >
                  <SelectTrigger id="product-active" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVE_FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {kind === "sales" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sales-granularity">Granularity</Label>
                <Select
                  name="granularity"
                  defaultValue={salesFilters.granularity}
                  items={GRANULARITY_ITEMS}
                >
                  <SelectTrigger id="sales-granularity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRANULARITY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-category">Category ID</Label>
                <Input
                  id="sales-category"
                  name="categoryId"
                  defaultValue={salesFilters.categoryId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-city">City</Label>
                <Input
                  id="sales-city"
                  name="city"
                  defaultValue={salesFilters.city}
                />
              </div>
            </>
          )}

          {kind === "orders" && (
            <>
              <GranularityField defaultValue={ordersFilters.granularity} />
              <div className="space-y-2">
                <Label htmlFor="orders-status">Status</Label>
                <Select
                  name="status"
                  defaultValue={ordersFilters.status}
                  items={ORDER_STATUS_FILTER_ITEMS}
                >
                  <SelectTrigger id="orders-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders-payment">Payment status</Label>
                <Select
                  name="paymentStatus"
                  defaultValue={ordersFilters.paymentStatus}
                  items={PAYMENT_STATUS_FILTER_ITEMS}
                >
                  <SelectTrigger id="orders-payment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders-number">Order number</Label>
                <Input
                  id="orders-number"
                  name="orderNumber"
                  defaultValue={ordersFilters.orderNumber}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders-phone">Customer phone</Label>
                <Input
                  id="orders-phone"
                  name="customerPhone"
                  defaultValue={ordersFilters.customerPhone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders-customer">Customer ID</Label>
                <Input
                  id="orders-customer"
                  name="customerId"
                  defaultValue={ordersFilters.customerId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders-city">City</Label>
                <Input
                  id="orders-city"
                  name="city"
                  defaultValue={ordersFilters.city}
                />
              </div>
            </>
          )}

          {kind === "inventory" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="inventory-category">Category ID</Label>
                <Input
                  id="inventory-category"
                  name="categoryId"
                  defaultValue={inventoryFilters.categoryId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-active">Active</Label>
                <Select
                  name="isActive"
                  defaultValue={inventoryFilters.isActive}
                  items={ACTIVE_FILTER_ITEMS}
                >
                  <SelectTrigger id="inventory-active" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVE_FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="lowStockOnly"
                  defaultChecked={inventoryFilters.lowStockOnly}
                  className="size-4 rounded border border-input"
                />
                Low stock only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="outOfStockOnly"
                  defaultChecked={inventoryFilters.outOfStockOnly}
                  className="size-4 rounded border border-input"
                />
                Out of stock only
              </label>
            </>
          )}

          {kind === "customers" && (
            <>
              <GranularityField defaultValue={customersFilters.granularity} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="hasOrderInRange"
                  defaultChecked={customersFilters.hasOrderInRange}
                  className="size-4 rounded border border-input"
                />
                Has order in date range
              </label>
              <div className="space-y-2">
                <Label htmlFor="customers-city">City</Label>
                <Input
                  id="customers-city"
                  name="city"
                  defaultValue={customersFilters.city}
                />
              </div>
            </>
          )}

          {kind === "payments" && (
            <>
              <GranularityField defaultValue={paymentsFilters.granularity} />
              <div className="space-y-2">
                <Label htmlFor="payments-status">Status</Label>
                <Select
                  name="status"
                  defaultValue={paymentsFilters.status}
                  items={PAYMENT_STATUS_FILTER_ITEMS}
                >
                  <SelectTrigger id="payments-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payments-order">Order number</Label>
                <Input
                  id="payments-order"
                  name="orderNumber"
                  defaultValue={paymentsFilters.orderNumber}
                />
              </div>
            </>
          )}

          <SheetFooter>
            <Button type="submit">Apply filters</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
