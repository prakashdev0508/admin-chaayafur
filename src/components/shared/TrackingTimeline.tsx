import { Check } from "lucide-react";
import type { OrderTracking } from "@/types/order";
import { orderStatusVariants } from "@/lib/order-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

type TrackingTimelineProps = {
  tracking?: OrderTracking;
  loading?: boolean;
};

export function TrackingTimeline({ tracking, loading }: TrackingTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!tracking) {
    return (
      <p className="text-sm text-muted-foreground">
        Tracking information is not available.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge variant={orderStatusVariants[tracking.currentStatus]}>
          {tracking.currentStatus}
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          Payment: {tracking.paymentStatus}
        </span>
      </div>
      <div className="space-y-0">
        {tracking.timeline.map((step, index) => (
          <div key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border",
                  step.isCompleted
                    ? "border-primary bg-primary/10 text-primary"
                    : step.isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                )}
              >
                {step.isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              {index < tracking.timeline.length - 1 && (
                <div
                  className={cn(
                    "w-px flex-1 min-h-8",
                    step.isCompleted ? "bg-primary/30" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p
                className={cn(
                  "font-medium",
                  step.isCurrent && "text-primary",
                  !step.isCompleted && !step.isCurrent && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {step.occurredAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(step.occurredAt)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
