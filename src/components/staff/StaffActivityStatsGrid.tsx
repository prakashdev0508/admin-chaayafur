import { formatCurrency } from "@/lib/format";
import type { StaffActivityStats } from "@/types/auth";

const STAT_ITEMS: {
  key: keyof StaffActivityStats;
  label: string;
  currency?: boolean;
}[] = [
  { key: "ordersConfirmed", label: "Orders confirmed" },
  { key: "ordersShipped", label: "Orders shipped" },
  { key: "ordersDelivered", label: "Orders delivered" },
  { key: "ordersCancelled", label: "Orders cancelled" },
  { key: "refundsInitiatedStatus", label: "Refund initiated (status)" },
  { key: "refundsInitiated", label: "Refunds initiated" },
  { key: "refundsCompleted", label: "Refunds completed" },
  {
    key: "refundsProcessedAmount",
    label: "Refunds processed amount",
    currency: true,
  },
];

export function StaffActivityStatsGrid({ stats }: { stats: StaffActivityStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_ITEMS.map(({ key, label, currency }) => {
        const value = stats[key];
        return (
          <div key={key} className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">
              {currency ? formatCurrency(value) : value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
