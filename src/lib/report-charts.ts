import type { ReportGranularity } from "@/types/dashboard";
import type { TrendPoint } from "@/types/reports";

export function formatReportTrendLabel(
  period: string,
  granularity: ReportGranularity = "daily",
) {
  const date = new Date(period);
  if (granularity === "monthly") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
  if (granularity === "weekly") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function trendToChartData(
  points: TrendPoint[],
  granularity: ReportGranularity = "daily",
) {
  return points.map((point) => ({
    label: formatReportTrendLabel(point.period, granularity),
    value: point.value,
  }));
}

export function namedRowsToChartData(rows: { name: string; value: number }[]) {
  return rows.map((row) => ({ name: row.name, value: row.value }));
}

export const stockDistributionLabels: Record<string, string> = {
  out_of_stock: "Out of stock",
  low_stock: "Low stock",
  healthy: "Healthy",
};
