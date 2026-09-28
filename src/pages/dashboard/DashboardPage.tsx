import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/format";
import { getDefaultReportDateRange } from "@/lib/report-dates";
import { queryKeys } from "@/lib/query-keys";
import { getDashboard } from "@/services/dashboard.service";
import type { ReportGranularity } from "@/types/dashboard";

const revenueChartConfig = {
  value: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const ordersChartConfig = {
  value: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const barChartConfig = {
  value: { label: "Value", color: "var(--chart-3)" },
} satisfies ChartConfig;

function formatTrendLabel(period: string, granularity: ReportGranularity) {
  const date = new Date(period);
  if (granularity === "monthly") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
  if (granularity === "weekly") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function truncateLabel(name: string, maxLen: number) {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, Math.max(1, maxLen - 1))}…`;
}

const dashboardParams = {
  ...getDefaultReportDateRange(30),
  granularity: "daily" as ReportGranularity,
};

export function DashboardPage() {
  const isMobile = useIsMobile();
  const params = useMemo(() => dashboardParams, []);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => getDashboard(params),
  });

  const revenueChartData = useMemo(() => {
    if (!data) return [];
    return data.charts.revenueTrend.map((point) => ({
      label: formatTrendLabel(point.period, data.range.granularity),
      value: point.value,
    }));
  }, [data]);

  const ordersChartData = useMemo(() => {
    if (!data) return [];
    return data.charts.ordersTrend.map((point) => ({
      label: formatTrendLabel(point.period, data.range.granularity),
      value: point.value,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Dashboard"
          description="Store KPIs and trends from completed sales."
        />
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load dashboard"}
        </p>
      </div>
    );
  }

  const { kpis, charts } = data;

  const kpiCards = [
    {
      label: "Today's revenue",
      value: formatCurrency(kpis.todaysRevenue),
      description: `${kpis.todaysOrders} orders today`,
    },
    {
      label: "Pending orders",
      value: String(kpis.pendingOrders),
      description: "Awaiting confirmation",
    },
    {
      label: "Delivered today",
      value: String(kpis.deliveredOrdersToday),
      description: `${kpis.cancelledOrdersToday} cancelled today`,
    },
    {
      label: "New customers today",
      value: String(kpis.newCustomersToday),
      description: "Registered today",
    },
    {
      label: "Inventory value",
      value: formatCurrency(kpis.inventoryValue),
      description: `${kpis.lowStockItems} low-stock SKUs`,
    },
    {
      label: "Average order value",
      value: formatCurrency(kpis.averageOrderValue),
      description: "In selected trend range",
    },
    {
      label: "Top product",
      value: kpis.topSellingProduct?.name ?? "—",
      description: kpis.topSellingProduct
        ? `${kpis.topSellingProduct.units} units in range`
        : "No sales in range",
    },
    {
      label: "Top category",
      value: kpis.topCategory?.name ?? "—",
      description: kpis.topCategory
        ? formatCurrency(kpis.topCategory.revenue)
        : "No sales in range",
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description="KPIs and charts from countable orders (completed payment, not pending/cancelled)."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat) => (
          <Card key={stat.label} className="min-w-0">
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="truncate text-xl font-semibold">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Gross revenue by period</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={revenueChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart data={revenueChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 28 : 16}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  fill="var(--color-value)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Orders trend</CardTitle>
            <CardDescription>Countable orders by period</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={ordersChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart data={ordersChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 28 : 16}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  fill="var(--color-value)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <RankedBarChart
          title="Top products"
          description="Units sold in range"
          isMobile={isMobile}
          rows={charts.topProducts.map((row) => ({
            name: row.name,
            value: row.value,
            hint: row.amount ? formatCurrency(row.amount) : undefined,
          }))}
        />
        <RankedBarChart
          title="Sales by category"
          description="Revenue in range"
          isMobile={isMobile}
          valueFormatter={(v) => formatCurrency(v)}
          rows={charts.salesByCategory.map((row) => ({
            name: row.name,
            value: row.value,
          }))}
        />
        <RankedBarChart
          title="Sales by city"
          description="Revenue in range"
          isMobile={isMobile}
          valueFormatter={(v) => formatCurrency(v)}
          rows={charts.salesByCity.map((row) => ({
            name: row.name,
            value: row.value,
          }))}
        />
        <RankedBarChart
          title="Order status"
          description="Orders created in range"
          isMobile={isMobile}
          rows={charts.orderStatusDistribution.map((row) => ({
            name: row.name,
            value: row.value,
          }))}
        />
        <RankedBarChart
          title="Payment methods"
          description="Orders in range"
          isMobile={isMobile}
          rows={charts.paymentMethodDistribution.map((row) => ({
            name: row.name,
            value: row.value,
          }))}
        />
      </div>
    </div>
  );
}

function RankedBarChart({
  title,
  description,
  rows,
  isMobile,
  valueFormatter = (v) => String(v),
}: {
  title: string;
  description: string;
  rows: { name: string; value: number; hint?: string }[];
  isMobile: boolean;
  valueFormatter?: (value: number) => string;
}) {
  const maxLabelLen = isMobile ? 10 : 16;
  const chartData = rows.slice(0, 8).map((row) => ({
    ...row,
    shortName: truncateLabel(row.name, maxLabelLen),
  }));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for this range.</p>
        ) : (
          <ChartContainer
            config={barChartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: isMobile ? 0 : 8, right: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={isMobile ? 72 : 100}
                tickLine={false}
                axisLine={false}
                fontSize={isMobile ? 10 : 12}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_value, payload) => {
                      const fullName = payload?.[0]?.payload?.name as
                        | string
                        | undefined;
                      return fullName ?? _value;
                    }}
                    formatter={(value, _name, item) => {
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
