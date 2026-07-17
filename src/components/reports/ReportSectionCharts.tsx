import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatOrderSummaryStatus } from "@/components/data-table/report-columns";
import { formatCurrency } from "@/lib/format";
import {
  formatCustomerChartName,
} from "@/lib/report-kpis";
import {
  stockDistributionLabels,
  trendToChartData,
} from "@/lib/report-charts";
import { paymentStatusLabels } from "@/lib/payment-status";
import type { ReportGranularity } from "@/types/dashboard";
import type {
  CustomersReportCharts,
  InventoryReportCharts,
  OrdersReportCharts,
  PaymentsReportCharts,
  ProductReportCharts,
  ReportKind,
  SalesReportCharts,
} from "@/types/reports";
import type { PaymentStatus } from "@/types/payment";

const areaConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

const areaConfigAlt = {
  value: { label: "Value", color: "var(--chart-2)" },
} satisfies ChartConfig;

const barConfig = {
  value: { label: "Value", color: "var(--chart-3)" },
} satisfies ChartConfig;

type ReportSectionChartsProps = {
  kind: ReportKind;
  granularity: ReportGranularity;
  charts:
    | ProductReportCharts
    | SalesReportCharts
    | OrdersReportCharts
    | InventoryReportCharts
    | CustomersReportCharts
    | PaymentsReportCharts;
};

export function ReportSectionCharts({
  kind,
  granularity,
  charts,
}: ReportSectionChartsProps) {
  switch (kind) {
    case "products":
      return (
        <ProductCharts
          charts={charts as ProductReportCharts}
          granularity={granularity}
        />
      );
    case "sales":
      return (
        <SalesCharts
          charts={charts as SalesReportCharts}
          granularity={granularity}
        />
      );
    case "orders":
      return (
        <OrdersCharts
          charts={charts as OrdersReportCharts}
          granularity={granularity}
        />
      );
    case "inventory":
      return <InventoryCharts charts={charts as InventoryReportCharts} />;
    case "customers":
      return (
        <CustomersCharts
          charts={charts as CustomersReportCharts}
          granularity={granularity}
        />
      );
    case "payments":
      return (
        <PaymentsCharts
          charts={charts as PaymentsReportCharts}
          granularity={granularity}
        />
      );
  }
}

function ReportChartLayout({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {primary}
      {secondary.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">{secondary}</div>
      )}
    </div>
  );
}

function TrendAreaChart({
  title,
  description,
  data,
  config,
  valueFormatter = (v) => String(v),
}: {
  title: string;
  description: string;
  data: { label: string; value: number }[];
  config: ChartConfig;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
            <AreaChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => valueFormatter(Number(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function HorizontalBarChart({
  title,
  description,
  data,
  nameFormatter = (n) => n,
  valueFormatter = (v) => String(v),
  hintFromAmount,
}: {
  title: string;
  description: string;
  data: { name: string; value: number; amount?: string }[];
  nameFormatter?: (name: string) => string;
  valueFormatter?: (value: number) => string;
  hintFromAmount?: boolean;
}) {
  const chartData = data.slice(0, 10).map((row) => ({
    name: nameFormatter(row.name),
    value: row.value,
    hint: hintFromAmount && row.amount ? formatCurrency(row.amount) : undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ChartContainer config={barConfig} className="aspect-auto h-[240px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _n, item) => {
                      const hint = item.payload?.hint as string | undefined;
                      return hint ?? valueFormatter(Number(value));
                    }}
                  />
                }
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      No chart data for this range.
    </p>
  );
}

function ProductCharts({
  charts,
  granularity,
}: {
  charts: ProductReportCharts;
  granularity: ReportGranularity;
}) {
  return (
    <ReportChartLayout
      primary={
        <TrendAreaChart
          title="Units sold trend"
          description="By period"
          data={trendToChartData(charts.unitsTrend, granularity)}
          config={areaConfig}
        />
      }
      secondary={[
        <HorizontalBarChart
          key="top-products"
          title="Top products"
          description="Units sold"
          data={charts.topProducts}
          hintFromAmount
          valueFormatter={(v) => `${v} units`}
        />,
        <HorizontalBarChart
          key="revenue-category"
          title="Revenue by category"
          description="Gross item revenue"
          data={charts.revenueByCategory}
          valueFormatter={(v) => formatCurrency(v)}
          hintFromAmount
        />,
      ]}
    />
  );
}

function SalesCharts({
  charts,
  granularity,
}: {
  charts: SalesReportCharts;
  granularity: ReportGranularity;
}) {
  return (
    <ReportChartLayout
      primary={
        <TrendAreaChart
          title="Revenue by period"
          description="Gross revenue per bucket"
          data={trendToChartData(charts.revenueByPeriod, granularity)}
          config={areaConfig}
          valueFormatter={(v) => formatCurrency(v)}
        />
      }
      secondary={[
        <TrendAreaChart
          key="orders-period"
          title="Orders by period"
          description="Order count per bucket"
          data={trendToChartData(charts.ordersByPeriod, granularity)}
          config={areaConfigAlt}
        />,
        <TrendAreaChart
          key="refunds-period"
          title="Refunds by period"
          description="Processed refund amount"
          data={trendToChartData(charts.refundsByPeriod, granularity)}
          config={areaConfig}
          valueFormatter={(v) => formatCurrency(v)}
        />,
      ]}
    />
  );
}

function OrdersCharts({
  charts,
  granularity,
}: {
  charts: OrdersReportCharts;
  granularity: ReportGranularity;
}) {
  return (
    <ReportChartLayout
      primary={
        <HorizontalBarChart
          title="Status distribution"
          description="Orders in period"
          data={charts.statusDistribution}
          nameFormatter={(n) => formatOrderSummaryStatus(n)}
        />
      }
      secondary={[
        <TrendAreaChart
          key="orders-trend"
          title="Orders trend"
          description="Filtered orders over time"
          data={trendToChartData(charts.ordersTrend, granularity)}
          config={areaConfigAlt}
        />,
        <TrendAreaChart
          key="revenue-trend"
          title="Revenue trend"
          description="Countable order revenue"
          data={trendToChartData(charts.revenueTrend, granularity)}
          config={areaConfig}
          valueFormatter={(v) => formatCurrency(v)}
        />,
      ]}
    />
  );
}

function InventoryCharts({ charts }: { charts: InventoryReportCharts }) {
  const distribution = charts.stockDistribution.map((row) => ({
    name: stockDistributionLabels[row.name] ?? row.name,
    value: row.value,
  }));

  return (
    <ReportChartLayout
      primary={
        <HorizontalBarChart
          title="Stock value by category"
          description="Current snapshot"
          data={charts.stockValueByCategory}
          valueFormatter={(v) => formatCurrency(v)}
          hintFromAmount
        />
      }
      secondary={[
        <HorizontalBarChart
          key="low-stock"
          title="Low stock products"
          description="Lowest units on hand"
          data={charts.lowStockProducts}
          valueFormatter={(v) => `${v} units`}
          hintFromAmount
        />,
        <HorizontalBarChart
          key="stock-health"
          title="Stock health"
          description="SKU counts by band"
          data={distribution}
        />,
      ]}
    />
  );
}

function CustomersCharts({
  charts,
  granularity,
}: {
  charts: CustomersReportCharts;
  granularity: ReportGranularity;
}) {
  return (
    <ReportChartLayout
      primary={
        <TrendAreaChart
          title="Registrations"
          description="New customers over time"
          data={trendToChartData(charts.registrationsTrend, granularity)}
          config={areaConfigAlt}
        />
      }
      secondary={[
        <HorizontalBarChart
          key="top-spend"
          title="Top customers by spend"
          description="In period"
          data={charts.topCustomersBySpend}
          nameFormatter={formatCustomerChartName}
          valueFormatter={(v) => formatCurrency(v)}
          hintFromAmount
        />,
        <HorizontalBarChart
          key="by-city"
          title="Customers by city"
          description="Registered in period"
          data={charts.customersByCity}
          valueFormatter={(v) => `${v} customers`}
        />,
      ]}
    />
  );
}

function PaymentsCharts({
  charts,
  granularity,
}: {
  charts: PaymentsReportCharts;
  granularity: ReportGranularity;
}) {
  return (
    <ReportChartLayout
      primary={
        <HorizontalBarChart
          title="Payment status"
          description="Count by status"
          data={charts.statusDistribution}
          nameFormatter={(n) =>
            paymentStatusLabels[n as PaymentStatus] ?? n
          }
          hintFromAmount
        />
      }
      secondary={[
        <TrendAreaChart
          key="amount-period"
          title="Amount by period"
          description="Sum of payment amounts"
          data={trendToChartData(charts.amountByPeriod, granularity)}
          config={areaConfig}
          valueFormatter={(v) => formatCurrency(v)}
        />,
        <HorizontalBarChart
          key="methods"
          title="Payment methods"
          description="Transaction count"
          data={charts.methodDistribution}
        />,
      ]}
    />
  );
}
