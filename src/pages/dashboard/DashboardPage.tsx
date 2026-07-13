import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { listOrders } from "@/services/orders.service";
import { listPayments } from "@/services/payments.service";
import { listProducts } from "@/services/products.service";
import type { RecentOrderRow } from "@/types";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function aggregateRevenue(
  payments: { amount: string; status: string; createdAt: string }[],
  days: number,
) {
  const buckets = new Map<string, number>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    buckets.set(key, 0);
  }

  payments
    .filter((p) => p.status === "COMPLETED")
    .forEach((p) => {
      const key = new Date(p.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + parseFloat(p.amount));
      }
    });

  return Array.from(buckets.entries()).map(([label, revenue]) => ({
    label,
    revenue,
  }));
}

export function DashboardPage() {
  const [range, setRange] = useState<"months" | "weeks" | "days">("days");

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list({ page: 1, limit: 100 }),
    queryFn: () => listOrders({ page: 1, limit: 100 }),
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.list({ page: 1, limit: 100 }),
    queryFn: () => listPayments({ page: 1, limit: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => listProducts({ page: 1, limit: 100, isActive: true }),
  });

  const isLoading =
    ordersQuery.isLoading || paymentsQuery.isLoading || productsQuery.isLoading;

  const stats = useMemo(() => {
    const orders = ordersQuery.data?.items ?? [];
    const payments = paymentsQuery.data?.items ?? [];
    const products = productsQuery.data?.items ?? [];

    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0,
    );
    const ordersToday = orders.filter((o) => isToday(o.createdAt)).length;
    const activeProducts = products.length;
    const pendingShipments = orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "SHIPPED",
    ).length;

    return { totalRevenue, ordersToday, activeProducts, pendingShipments };
  }, [ordersQuery.data, paymentsQuery.data, productsQuery.data]);

  const chartData = useMemo(() => {
    const payments = paymentsQuery.data?.items ?? [];
    const days = range === "days" ? 7 : range === "weeks" ? 28 : 180;
    return aggregateRevenue(payments, days);
  }, [paymentsQuery.data, range]);

  const recentOrders: RecentOrderRow[] = useMemo(() => {
    return (ordersQuery.data?.items ?? []).slice(0, 5).map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      customer: order.customer?.phone ?? `Customer #${order.customerId}`,
      item: "—",
      amount: parseFloat(order.totalAmount),
      status: order.status,
    }));
  }, [ordersQuery.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: "From completed payments",
    },
    {
      label: "Orders Today",
      value: stats.ordersToday.toString(),
      description: "Placed today",
    },
    {
      label: "Active Products",
      value: stats.activeProducts.toString(),
      description: "Currently listed",
    },
    {
      label: "Pending Shipments",
      value: stats.pendingShipments.toString(),
      description: "Confirmed or shipped",
    },
  ];

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
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Completed payment revenue</CardDescription>
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
