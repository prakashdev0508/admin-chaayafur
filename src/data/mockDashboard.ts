import type { DashboardStats, RecentOrderRow } from "@/types";

export const dashboardStats: DashboardStats = {
  totalRevenue: 2847500,
  ordersToday: 18,
  activeProducts: 47,
  pendingShipments: 6,
  revenueByMonth: [
    { label: "Jan", revenue: 420000 },
    { label: "Feb", revenue: 380000 },
    { label: "Mar", revenue: 510000 },
    { label: "Apr", revenue: 460000 },
    { label: "May", revenue: 620000 },
    { label: "Jun", revenue: 457500 },
  ],
  revenueByWeek: [
    { label: "W1", revenue: 98000 },
    { label: "W2", revenue: 112000 },
    { label: "W3", revenue: 105000 },
    { label: "W4", revenue: 142500 },
  ],
  revenueByDay: [
    { label: "Mon", revenue: 18000 },
    { label: "Tue", revenue: 22000 },
    { label: "Wed", revenue: 19500 },
    { label: "Thu", revenue: 25000 },
    { label: "Fri", revenue: 28000 },
    { label: "Sat", revenue: 32000 },
    { label: "Sun", revenue: 15000 },
  ],
};

export const recentOrders: RecentOrderRow[] = [
  {
    id: "1",
    orderNumber: "ORD-20260710-1042",
    customer: "Ananya Mehta",
    item: "Meridian Dining Table",
    amount: 55900,
    status: "CONFIRMED",
  },
  {
    id: "2",
    orderNumber: "ORD-20260710-1041",
    customer: "Rohan Kapoor",
    item: "Warmly Lounge Chair",
    amount: 25900,
    status: "SHIPPED",
  },
  {
    id: "3",
    orderNumber: "ORD-20260709-1040",
    customer: "Sneha Pillai",
    item: "Oakline Bookshelf",
    amount: 18900,
    status: "DELIVERED",
  },
  {
    id: "4",
    orderNumber: "ORD-20260709-1039",
    customer: "Vikram Desai",
    item: "Sierra Sectional Sofa",
    amount: 89900,
    status: "PENDING",
  },
  {
    id: "5",
    orderNumber: "ORD-20260708-1038",
    customer: "Meera Joshi",
    item: "Calmly Working Table",
    amount: 35900,
    status: "CONFIRMED",
  },
  {
    id: "6",
    orderNumber: "ORD-20260708-1037",
    customer: "Arjun Nair",
    item: "Edge Sofa Armchair",
    amount: 42900,
    status: "CANCELLED",
  },
];

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
