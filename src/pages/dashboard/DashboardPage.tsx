import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DataTable } from "@/components/data-table/data-table";
import { recentOrdersColumns } from "@/components/data-table/recent-orders-columns";
import {
  dashboardStats,
  recentOrders,
  formatCurrency,
} from "@/data/mockDashboard";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const statCards = [
  {
    label: "Total Revenue",
    value: formatCurrency(dashboardStats.totalRevenue),
    change: "+12.5%",
    trend: "up" as const,
    description: "Trending up this month",
  },
  {
    label: "Orders Today",
    value: dashboardStats.ordersToday.toString(),
    change: "+8.2%",
    trend: "up" as const,
    description: "3 awaiting confirmation",
  },
  {
    label: "Active Products",
    value: dashboardStats.activeProducts.toString(),
    change: "-2",
    trend: "down" as const,
    description: "2 out of stock",
  },
  {
    label: "Pending Shipments",
    value: dashboardStats.pendingShipments.toString(),
    change: "+1",
    trend: "up" as const,
    description: "Due within 48 hours",
  },
];

export function DashboardPage() {
  const [range, setRange] = useState<"months" | "weeks" | "days">("months");

  const chartData =
    range === "months"
      ? dashboardStats.revenueByMonth
      : range === "weeks"
        ? dashboardStats.revenueByWeek
        : dashboardStats.revenueByDay;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description="Overview of your store performance and recent activity."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="size-3 text-[#3d6b4a]" />
                ) : (
                  <TrendingDown className="size-3 text-[#9f2f2d]" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-[#3d6b4a]" : "text-[#9f2f2d]"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total revenue for the selected period</CardDescription>
          </div>
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as typeof range)}
          >
            <TabsList>
              <TabsTrigger value="months">Last 6 months</TabsTrigger>
              <TabsTrigger value="weeks">Last 4 weeks</TabsTrigger>
              <TabsTrigger value="days">Last 7 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--color-revenue)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest transactions from your store</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={recentOrdersColumns} data={recentOrders} pageSize={5} />
        </CardContent>
      </Card>
    </div>
  );
}
