import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/data-table/data-table";
import {
  customerReportColumns,
  inventoryReportColumns,
  orderReportColumns,
  paymentReportColumns,
  productReportColumns,
  salesReportColumns,
} from "@/components/data-table/report-columns";
import { ReportExportButton } from "@/components/reports/ReportExportButton";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { ReportKpiGrid } from "@/components/reports/ReportSectionChrome";
import { ReportSectionCharts } from "@/components/reports/ReportSectionCharts";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  buildCustomersReportParams,
  buildInventoryReportParams,
  buildOrdersReportParams,
  buildPaymentsReportParams,
  buildProductReportParams,
  buildSalesReportParams,
  countCustomersReportFilters,
  countInventoryReportFilters,
  countOrdersReportFilters,
  countPaymentsReportFilters,
  countProductReportFilters,
  countSalesReportFilters,
  defaultCustomersReportFilters,
  defaultInventoryReportFilters,
  defaultOrdersReportFilters,
  defaultPaymentsReportFilters,
  defaultProductReportFilters,
  defaultSalesReportFilters,
  isReportKind,
  reportTabLabels,
} from "@/lib/report-filters";
import {
  customersReportKpis,
  inventoryReportKpis,
  ordersReportKpis,
  paymentsReportKpis,
  productReportKpis,
  salesReportKpis,
} from "@/lib/report-kpis";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import {
  getCustomersReport,
  getInventoryReport,
  getOrdersReport,
  getPaymentsReport,
  getProductReport,
  getSalesReport,
} from "@/services/reports.service";
import type {
  CustomersReportKpis,
  CustomersReportResponse,
  InventoryReportKpis,
  InventoryReportResponse,
  OrdersReportKpis,
  OrdersReportResponse,
  PaymentsReportKpis,
  PaymentsReportResponse,
  ProductReportKpis,
  ProductReportResponse,
  ReportKind,
  SalesReportKpis,
  SalesReportResponse,
} from "@/types/reports";

export function ReportsPage() {
  const { reportKind: kindParam } = useParams<{ reportKind: string }>();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_REPORTS);

  if (!isReportKind(kindParam)) {
    return <Navigate to="/reports/products" replace />;
  }

  return <ReportSectionView kind={kindParam} canView={canView} />;
}

function ReportSectionView({
  kind,
  canView,
}: {
  kind: ReportKind;
  canView: boolean;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [productFilters, setProductFilters] = useState(
    defaultProductReportFilters,
  );
  const [salesFilters, setSalesFilters] = useState(defaultSalesReportFilters);
  const [ordersFilters, setOrdersFilters] = useState(
    defaultOrdersReportFilters,
  );
  const [inventoryFilters, setInventoryFilters] = useState(
    defaultInventoryReportFilters,
  );
  const [customersFilters, setCustomersFilters] = useState(
    defaultCustomersReportFilters,
  );
  const [paymentsFilters, setPaymentsFilters] = useState(
    defaultPaymentsReportFilters,
  );

  const productParams = useMemo(
    () => buildProductReportParams(productFilters, page + 1, pageSize),
    [productFilters, page, pageSize],
  );
  const salesParams = useMemo(
    () => buildSalesReportParams(salesFilters, page + 1, pageSize),
    [salesFilters, page, pageSize],
  );
  const ordersParams = useMemo(
    () => buildOrdersReportParams(ordersFilters, page + 1, pageSize),
    [ordersFilters, page, pageSize],
  );
  const inventoryParams = useMemo(
    () => buildInventoryReportParams(inventoryFilters, page + 1, pageSize),
    [inventoryFilters, page, pageSize],
  );
  const customersParams = useMemo(
    () => buildCustomersReportParams(customersFilters, page + 1, pageSize),
    [customersFilters, page, pageSize],
  );
  const paymentsParams = useMemo(
    () => buildPaymentsReportParams(paymentsFilters, page + 1, pageSize),
    [paymentsFilters, page, pageSize],
  );

  const productQuery = useQuery({
    queryKey: queryKeys.reports.products(productParams),
    queryFn: () => getProductReport(productParams),
    enabled: canView && kind === "products",
  });
  const salesQuery = useQuery({
    queryKey: queryKeys.reports.sales(salesParams),
    queryFn: () => getSalesReport(salesParams),
    enabled: canView && kind === "sales",
  });
  const ordersQuery = useQuery({
    queryKey: queryKeys.reports.orders(ordersParams),
    queryFn: () => getOrdersReport(ordersParams),
    enabled: canView && kind === "orders",
  });
  const inventoryQuery = useQuery({
    queryKey: queryKeys.reports.inventory(inventoryParams),
    queryFn: () => getInventoryReport(inventoryParams),
    enabled: canView && kind === "inventory",
  });
  const customersQuery = useQuery({
    queryKey: queryKeys.reports.customers(customersParams),
    queryFn: () => getCustomersReport(customersParams),
    enabled: canView && kind === "customers",
  });
  const paymentsQuery = useQuery({
    queryKey: queryKeys.reports.payments(paymentsParams),
    queryFn: () => getPaymentsReport(paymentsParams),
    enabled: canView && kind === "payments",
  });

  const activeFilterCount = useMemo(() => {
    switch (kind) {
      case "products":
        return countProductReportFilters(productFilters);
      case "sales":
        return countSalesReportFilters(salesFilters);
      case "orders":
        return countOrdersReportFilters(ordersFilters);
      case "inventory":
        return countInventoryReportFilters(inventoryFilters);
      case "customers":
        return countCustomersReportFilters(customersFilters);
      case "payments":
        return countPaymentsReportFilters(paymentsFilters);
    }
  }, [
    kind,
    productFilters,
    salesFilters,
    ordersFilters,
    inventoryFilters,
    customersFilters,
    paymentsFilters,
  ]);

  const exportParams = useMemo(() => {
    switch (kind) {
      case "products":
        return buildProductReportParams(productFilters, 1, pageSize);
      case "sales":
        return buildSalesReportParams(salesFilters, 1, pageSize);
      case "orders":
        return buildOrdersReportParams(ordersFilters, 1, pageSize);
      case "inventory":
        return buildInventoryReportParams(inventoryFilters, 1, pageSize);
      case "customers":
        return buildCustomersReportParams(customersFilters, 1, pageSize);
      case "payments":
        return buildPaymentsReportParams(paymentsFilters, 1, pageSize);
    }
  }, [
    kind,
    productFilters,
    salesFilters,
    ordersFilters,
    inventoryFilters,
    customersFilters,
    paymentsFilters,
    pageSize,
  ]);

  const activeQuery = useMemo(() => {
    switch (kind) {
      case "products":
        return productQuery;
      case "sales":
        return salesQuery;
      case "orders":
        return ordersQuery;
      case "inventory":
        return inventoryQuery;
      case "customers":
        return customersQuery;
      case "payments":
        return paymentsQuery;
    }
  }, [
    kind,
    productQuery,
    salesQuery,
    ordersQuery,
    inventoryQuery,
    customersQuery,
    paymentsQuery,
  ]);

  const resetPage = () => setPage(0);

  useEffect(() => {
    resetPage();
  }, [kind]);

  const sectionTitle = reportTabLabels[kind];

  type SectionData =
    | ProductReportResponse
    | SalesReportResponse
    | OrdersReportResponse
    | InventoryReportResponse
    | CustomersReportResponse
    | PaymentsReportResponse;

  const reportData = activeQuery.data as SectionData | undefined;
  const granularity =
    reportData?.range.granularity ?? ("daily" as const);

  const kpiItems = useMemo(() => {
    if (!reportData) return [];
    switch (kind) {
      case "products":
        return productReportKpis(reportData.kpis as ProductReportKpis);
      case "sales":
        return salesReportKpis(reportData.kpis as SalesReportKpis);
      case "orders":
        return ordersReportKpis(reportData.kpis as OrdersReportKpis);
      case "inventory":
        return inventoryReportKpis(reportData.kpis as InventoryReportKpis);
      case "customers":
        return customersReportKpis(reportData.kpis as CustomersReportKpis);
      case "payments":
        return paymentsReportKpis(reportData.kpis as PaymentsReportKpis);
    }
  }, [kind, reportData]);

  const tableConfig = useMemo(() => getTableConfig(kind), [kind]);

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title={sectionTitle}
          description="Analytics with KPIs, charts, and exportable tables."
        />
        <EmptyState
          icon={BarChart3}
          title="Access restricted"
          description="You do not have permission to view reports."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={sectionTitle}
        description="KPIs and charts for the selected filters, plus a paginated detail table."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => activeQuery.refetch()}
              disabled={activeQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${activeQuery.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <ReportFiltersSheet
              kind={kind}
              activeCount={activeFilterCount}
              productFilters={productFilters}
              salesFilters={salesFilters}
              ordersFilters={ordersFilters}
              inventoryFilters={inventoryFilters}
              customersFilters={customersFilters}
              paymentsFilters={paymentsFilters}
              onApplyProduct={(next) => {
                setProductFilters(next);
                resetPage();
              }}
              onApplySales={(next) => {
                setSalesFilters(next);
                resetPage();
              }}
              onApplyOrders={(next) => {
                setOrdersFilters(next);
                resetPage();
              }}
              onApplyInventory={(next) => {
                setInventoryFilters(next);
                resetPage();
              }}
              onApplyCustomers={(next) => {
                setCustomersFilters(next);
                resetPage();
              }}
              onApplyPayments={(next) => {
                setPaymentsFilters(next);
                resetPage();
              }}
            />
            <ReportExportButton kind={kind} params={exportParams} />
          </div>
        }
      />

      {activeQuery.error && (
        <p className="text-sm text-destructive">
          {activeQuery.error instanceof Error
            ? activeQuery.error.message
            : "Failed to load report"}
        </p>
      )}

      {activeQuery.isLoading && !reportData ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : reportData ? (
        <>
          <ReportKpiGrid items={kpiItems} />
          <ReportSectionCharts
            kind={kind}
            granularity={granularity}
            charts={reportData.charts}
          />
          <Card>
            <CardHeader>
              <CardTitle>{tableConfig.title}</CardTitle>
              <CardDescription>{tableConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={tableConfig.columns}
                data={reportData.table.items}
                manualPagination
                pageIndex={page}
                pageSize={pageSize}
                pageCount={reportData.table.meta.totalPages ?? 1}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  resetPage();
                }}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function getTableConfig(kind: ReportKind): {
  title: string;
  description: string;
  columns: ColumnDef<unknown>[];
} {
  switch (kind) {
    case "products":
      return {
        title: "Product detail",
        description: "Sales and stock per SKU in the selected period.",
        columns: productReportColumns as ColumnDef<unknown>[],
      };
    case "sales":
      return {
        title: "Period breakdown",
        description: "One row per time bucket (matches chart granularity).",
        columns: salesReportColumns as ColumnDef<unknown>[],
      };
    case "orders":
      return {
        title: "Orders",
        description: "Filtered order lines for the selected period.",
        columns: orderReportColumns as ColumnDef<unknown>[],
      };
    case "inventory":
      return {
        title: "Inventory lines",
        description: "Current snapshot rows matching filters.",
        columns: inventoryReportColumns as ColumnDef<unknown>[],
      };
    case "customers":
      return {
        title: "Customers",
        description: "Customer metrics for the selected period.",
        columns: customerReportColumns as ColumnDef<unknown>[],
      };
    case "payments":
      return {
        title: "Payments",
        description: "Payment rows (dates on payment createdAt).",
        columns: paymentReportColumns as ColumnDef<unknown>[],
      };
  }
}
