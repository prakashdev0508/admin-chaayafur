import {
  Check,
  Circle,
  Clock3,
  Package,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import type { OrderStatus, OrderTracking } from "@/types/order";
import { orderStatusLabels, orderStatusVariants } from "@/lib/order-status";
import {
  paymentStatusLabels,
  paymentStatusVariants,
} from "@/lib/payment-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

type TrackingTimelineProps = {
  tracking?: OrderTracking;
  loading?: boolean;
};

const statusIcons: Record<OrderStatus, typeof Clock3> = {
  PENDING: Clock3,
  CONFIRMED: Package,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: X,
};

function getProgress(timeline: OrderTracking["timeline"]) {
  if (timeline.length === 0) return 0;
  const completed = timeline.filter((step) => step.isCompleted).length;
  const current = timeline.some((step) => step.isCurrent) ? 0.5 : 0;
  return Math.min(100, ((completed + current) / timeline.length) * 100);
}

export function TrackingTimeline({ tracking, loading }: TrackingTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm font-medium">Tracking unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This order does not have tracking data yet.
        </p>
      </div>
    );
  }

  const progress = getProgress(tracking.timeline);
  const currentStep = tracking.timeline.find((step) => step.isCurrent);
  const isCancelled = tracking.currentStatus === "CANCELLED";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-muted/30">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={orderStatusVariants[tracking.currentStatus]}>
                {orderStatusLabels[tracking.currentStatus]}
              </StatusBadge>
              <StatusBadge
                variant={paymentStatusVariants[tracking.paymentStatus]}
              >
                Payment · {paymentStatusLabels[tracking.paymentStatus]}
              </StatusBadge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Order {tracking.orderNumber}
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                {currentStep?.label ?? orderStatusLabels[tracking.currentStatus]}
              </h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {currentStep?.description ??
                  "Status updates will appear here as the order moves forward."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:min-w-[220px] lg:justify-end">
            <div className="relative flex size-20 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/50"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className={cn(
                    "transition-[stroke-dashoffset] duration-700 ease-out",
                    isCancelled ? "text-destructive/70" : "text-primary",
                  )}
                />
              </svg>
              <div className="text-center">
                <p className="text-lg font-semibold leading-none">
                  {Math.round(progress)}%
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Complete
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1.5 bg-muted/50">
          <div
            className={cn(
              "h-full transition-all duration-700 ease-out",
              isCancelled ? "bg-destructive/60" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-5 md:gap-2">
        {tracking.timeline.map((step, index) => {
          const Icon = statusIcons[step.status];
          const state = step.isCompleted
            ? "completed"
            : step.isCurrent
              ? "current"
              : "upcoming";

          return (
            <div
              key={step.status}
              className={cn(
                "relative rounded-xl border p-4 transition-colors",
                state === "completed" && "border-primary/20 bg-primary/5",
                state === "current" &&
                  "border-primary bg-primary/10 shadow-[0_10px_30px_-20px_rgba(107,78,61,0.8)]",
                state === "upcoming" && "border-border/70 bg-muted/15",
              )}
            >
              {index < tracking.timeline.length - 1 && (
                <div
                  className={cn(
                    "absolute top-8 -right-2 z-10 hidden h-px w-4 xl:block",
                    step.isCompleted ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}

              <div
                className={cn(
                  "mb-3 flex size-9 items-center justify-center rounded-lg border",
                  state === "completed" &&
                    "border-primary/30 bg-primary text-primary-foreground",
                  state === "current" &&
                    "border-primary bg-background text-primary ring-2 ring-primary/20",
                  state === "upcoming" &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {state === "completed" ? (
                  <Check className="size-4" />
                ) : state === "current" ? (
                  <Icon className="size-4 animate-pulse" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>

              <p
                className={cn(
                  "text-sm font-medium",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {step.occurredAt && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {formatDate(step.occurredAt)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-0 md:hidden">
        {tracking.timeline.map((step, index) => {
          const Icon = statusIcons[step.status];
          const state = step.isCompleted
            ? "completed"
            : step.isCurrent
              ? "current"
              : "upcoming";

          return (
            <div key={step.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border",
                    state === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    state === "current" &&
                      "border-primary bg-background text-primary ring-4 ring-primary/10",
                    state === "upcoming" &&
                      "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  {state === "completed" ? (
                    <Check className="size-4" />
                  ) : state === "current" ? (
                    <Icon className="size-4" />
                  ) : (
                    <Circle className="size-3 fill-current" />
                  )}
                </div>
                {index < tracking.timeline.length - 1 && (
                  <div
                    className={cn(
                      "my-1 w-px flex-1 min-h-10",
                      step.isCompleted ? "bg-primary/35" : "bg-border",
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "mb-5 flex-1 rounded-xl border p-4",
                  state === "current" && "border-primary/30 bg-primary/5",
                  state === "upcoming" && "border-transparent bg-transparent px-0",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        state === "current" && "text-primary",
                        state === "upcoming" && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {state === "current" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      Now
                    </span>
                  )}
                </div>
                {step.occurredAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(step.occurredAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
