import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReportKpiCard } from "@/lib/report-kpis";

export function ReportKpiGrid({ items }: { items: ReportKpiCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {item.value}
            </CardTitle>
          </CardHeader>
          {item.description && (
            <CardContent>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
