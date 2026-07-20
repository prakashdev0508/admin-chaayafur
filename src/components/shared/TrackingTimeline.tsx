import {
  Check,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import type { OrderStatus, OrderTracking } from "@/types/order";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
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
  /** Destination label (city/state) from shipping address */
  destination?: string | null;
  origin?: string | null;
};

const statusIcons: Record<OrderStatus, typeof Clock3> = {
  PENDING: Clock3,
  CONFIRMED: Package,
  UNDER_PRODUCTION: Warehouse,
  PACKING: Package,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  REFUND_INITIATED: RotateCcw,
  PARTIALLY_REFUNDED: RotateCcw,
  REFUNDED: RotateCcw,
  CANCELLED: X,
};

const ROUTE_PATH =
  "M 48 220 C 120 200, 140 120, 220 140 C 300 160, 320 70, 400 90 C 480 110, 500 160, 552 150";

function getProgress(timeline: OrderTracking["timeline"]) {
  if (timeline.length === 0) return 0;
  const completed = timeline.filter((step) => step.isCompleted).length;
  const current = timeline.some((step) => step.isCurrent) ? 0.45 : 0;
  return Math.min(100, ((completed + current) / timeline.length) * 100);
}

function stepState(step: OrderTracking["timeline"][number]) {
  if (step.isCompleted) return "completed" as const;
  if (step.isCurrent) return "current" as const;
  return "upcoming" as const;
}

/** Approximate point along the SVG cubic path by progress 0–1 */
function pointOnRoute(t: number): { x: number; y: number } {
  const clamped = Math.min(1, Math.max(0, t));
  // Sample key waypoints matching the path silhouette
  const points = [
    { x: 48, y: 220 },
    { x: 120, y: 180 },
    { x: 220, y: 140 },
    { x: 320, y: 100 },
    { x: 400, y: 90 },
    { x: 480, y: 130 },
    { x: 552, y: 150 },
  ];
  const scaled = clamped * (points.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = points[Math.min(i, points.length - 1)];
  const b = points[Math.min(i + 1, points.length - 1)];
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
  };
}

function JourneyMap({
  progress,
  isCancelled,
  origin,
  destination,
  currentLabel,
}: {
  progress: number;
  isCancelled: boolean;
  origin: string;
  destination: string;
  currentLabel: string;
}) {
  const t = progress / 100;
  const pin = pointOnRoute(isCancelled ? Math.min(t, 0.35) : t);
  const stroke = isCancelled ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-[#F4F6F8]">
      {/* Soft map grid / terrain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-10 right-10 size-40 rounded-full bg-sky-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-20 size-48 rounded-full bg-emerald-100/50 blur-3xl"
        aria-hidden
      />

      <div className="relative px-4 pt-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Shipment route
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {origin}
              <span className="mx-2 text-slate-400">→</span>
              {destination}
            </p>
          </div>
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            {currentLabel}
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 600 270"
        className="relative h-[220px] w-full sm:h-[260px]"
        role="img"
        aria-label={`Route from ${origin} to ${destination}, ${Math.round(progress)}% complete`}
      >
        {/* Soft roads / streets */}
        <path
          d="M 0 80 Q 150 60 300 100 T 600 70"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="10"
          opacity="0.35"
        />
        <path
          d="M 0 180 Q 200 160 350 200 T 600 190"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="8"
          opacity="0.3"
        />

        {/* Full route track */}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 10"
          opacity="0.7"
        />

        {/* Progress along route */}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(2, progress)} 100`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
          style={{
            filter: isCancelled
              ? "drop-shadow(0 0 6px rgba(220,38,38,0.35))"
              : "drop-shadow(0 0 8px rgba(59,130,246,0.45))",
          }}
        />

        {/* Origin marker */}
        <g transform="translate(48, 220)">
          <circle r="14" fill="#fff" stroke="#E2E8F0" strokeWidth="2" />
          <circle r="7" fill={stroke} />
        </g>

        {/* Destination pin */}
        <g transform="translate(552, 150)">
          <path
            d="M0,-28 C12,-28 18,-16 18,-6 C18,6 0,22 0,22 C0,22 -18,6 -18,-6 C-18,-16 -12,-28 0,-28 Z"
            fill={progress >= 99 ? stroke : "#fff"}
            stroke={stroke}
            strokeWidth="2.5"
          />
          <circle
            cy="-10"
            r="5"
            fill={progress >= 99 ? "#fff" : stroke}
          />
        </g>

        {/* Moving package / courier pin */}
        {!isCancelled && progress < 99 && (
          <g transform={`translate(${pin.x}, ${pin.y})`}>
            <circle
              r="18"
              fill="#fff"
              stroke={stroke}
              strokeWidth="2.5"
              className="animate-pulse"
              style={{
                filter: "drop-shadow(0 6px 12px rgba(15,23,42,0.2))",
              }}
            />
            <g transform="translate(-8, -8)" fill={stroke}>
              <rect x="1" y="3" width="14" height="10" rx="1.5" />
              <path d="M1 6h14M8 3v10" stroke="#fff" strokeWidth="1.2" fill="none" />
            </g>
          </g>
        )}
      </svg>

      <div className="relative flex items-center justify-between gap-4 border-t border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-600 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <Warehouse className="size-3.5 text-slate-400" />
          <span className="font-medium">{origin}</span>
        </div>
        <div className="hidden h-px flex-1 bg-linear-to-r from-transparent via-slate-300 to-transparent sm:block" />
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 text-slate-400" />
          <span className="font-medium">{destination}</span>
        </div>
      </div>
    </div>
  );
}

export function TrackingTimeline({
  tracking,
  loading,
  destination,
  origin = "Warehouse",
}: TrackingTimelineProps) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-[320px] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">Tracking unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This order does not have tracking data yet.
        </p>
      </div>
    );
  }

  const progress = getProgress(tracking.timeline);
  const currentStep = tracking.timeline.find((step) => step.isCurrent);
  const isCancelled =
    tracking.currentStatus === "CANCELLED" ||
    tracking.currentStatus === "REFUNDED";
  const destinationLabel = destination?.trim() || "Customer";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="space-y-4">
        <JourneyMap
          progress={isCancelled ? 0 : progress}
          isCancelled={isCancelled}
          origin={origin?.trim() || "Warehouse"}
          destination={destinationLabel}
          currentLabel={
            currentStep?.label ?? getOrderStatusLabel(tracking.currentStatus)
          }
        />

        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <StatusBadge variant={getOrderStatusVariant(tracking.currentStatus)}>
            {getOrderStatusLabel(tracking.currentStatus)}
          </StatusBadge>
          <StatusBadge variant={paymentStatusVariants[tracking.paymentStatus]}>
            Payment · {paymentStatusLabels[tracking.paymentStatus]}
          </StatusBadge>
          <span className="ml-auto text-xs text-muted-foreground">
            Order {tracking.orderNumber}
          </span>
        </div>
      </div>

      {/* Timeline panel — matches reference style */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">
          Order Tracking
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Journey from fulfillment to delivery
        </p>

        <ol className="mt-6 space-y-0">
          {tracking.timeline.map((step, index) => {
            const Icon = statusIcons[step.status] ?? Clock3;
            const state = stepState(step);
            const isLast = index === tracking.timeline.length - 1;

            return (
              <li key={step.status} className="relative flex gap-3.5 pb-6 last:pb-0">
                {!isLast && (
                  <div
                    className="absolute top-8 bottom-0 left-[11px] w-px"
                    aria-hidden
                  >
                    {step.isCompleted ? (
                      <div className="h-full w-full bg-primary" />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to bottom, hsl(var(--border)) 0 5px, transparent 5px 10px)",
                        }}
                      />
                    )}
                  </div>
                )}

                <div className="relative z-10 mt-0.5 shrink-0">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border-2",
                      state === "completed" &&
                        "border-primary bg-primary text-primary-foreground",
                      state === "current" &&
                        "border-primary bg-background text-primary ring-[3px] ring-primary/20",
                      state === "upcoming" &&
                        "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {state === "completed" ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : state === "current" ? (
                      <Icon className="size-3" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1 -mt-0.5">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      state === "upcoming" && "text-muted-foreground",
                      state === "current" && "text-primary",
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm",
                      state === "upcoming"
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.description}
                  </p>
                  {step.occurredAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(step.occurredAt)}
                    </p>
                  ) : state === "current" ? (
                    <p className="mt-1 text-xs font-medium text-primary">
                      In progress
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
