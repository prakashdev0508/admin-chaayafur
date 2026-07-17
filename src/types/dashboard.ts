export type ReportGranularity = "daily" | "weekly" | "monthly";

export type DashboardQueryParams = {
  createdFrom?: string;
  createdTo?: string;
  granularity?: ReportGranularity;
};

export type TrendPoint = {
  period: string;
  value: number;
};

export type NamedChartRow = {
  name: string;
  value: number;
  amount?: string;
};

export type DashboardKpis = {
  todaysRevenue: string;
  todaysOrders: number;
  pendingOrders: number;
  deliveredOrdersToday: number;
  cancelledOrdersToday: number;
  newCustomersToday: number;
  inventoryValue: string;
  lowStockItems: number;
  topSellingProduct: { name: string; units: number } | null;
  topCategory: { name: string; revenue: string } | null;
  averageOrderValue: string;
};

export type DashboardResponse = {
  range: {
    createdFrom: string;
    createdTo: string;
    granularity: ReportGranularity;
    timezone: string;
  };
  kpis: DashboardKpis;
  charts: {
    revenueTrend: TrendPoint[];
    ordersTrend: TrendPoint[];
    topProducts: NamedChartRow[];
    salesByCategory: NamedChartRow[];
    salesByCity: NamedChartRow[];
    paymentMethodDistribution: NamedChartRow[];
    orderStatusDistribution: NamedChartRow[];
  };
};
