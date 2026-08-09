import { useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { usePermission } from "@/hooks/usePermission";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  isRefundOrderStatus,
} from "@/lib/order-status";
import { PERMISSIONS } from "@/lib/roles";
import { toOrderStatusSelectItems } from "@/lib/select-items";
import { isSuperAdminSlug } from "@/lib/staff-utils";
import { cn } from "@/lib/utils";
import type { StatusVariant } from "@/lib/status-variants";
import type { OrderStatus, UpdateOrderPayload } from "@/types/order";

/** Match StatusBadge capsule colors so editable status reads as the same control family. */
const capsuleVariantStyles: Record<StatusVariant, string> = {
  default: "border-transparent bg-secondary text-secondary-foreground",
  success: "border-transparent bg-[#edf3ec] text-[#3d6b4a]",
  warning: "border-transparent bg-[#fbf3db] text-[#956400]",
  danger: "border-transparent bg-[#fdebec] text-[#9f2f2d]",
  neutral: "border-transparent bg-muted text-muted-foreground",
  brand: "border-transparent bg-primary/10 text-primary",
};

const capsuleBase =
  "inline-flex h-7 w-auto min-w-0 shrink-0 items-center justify-center gap-1 rounded-4xl border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shadow-none transition-transform duration-150 ease-out active:scale-[0.97] data-[size=default]:h-7 [&_svg:not([class*='size-'])]:size-3 [&>svg:last-child]:hidden";

type OrderStatusSelectProps = {
  status: OrderStatus;
  orderNumber: string;
  onUpdate: (payload: UpdateOrderPayload) => Promise<unknown>;
  className?: string;
};

export function OrderStatusSelect({
  status,
  orderNumber,
  onUpdate,
  className,
}: OrderStatusSelectProps) {
  const { hasPermission, myPermissions } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_ORDERS);
  const isSuperAdmin = isSuperAdminSlug(
    myPermissions?.roleSlug ?? myPermissions?.role,
  );
  /** Cancelled orders are read-only for everyone except SUPER_ADMIN. */
  const showEditable = canUpdate && (status !== "CANCELLED" || isSuperAdmin);
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const statusItems = useMemo(
    () => toOrderStatusSelectItems(status),
    [status],
  );
  const variant = getOrderStatusVariant(status);

  if (!showEditable) {
    const badge = (
      <StatusBadge variant={variant} className={cn("h-7 px-2.5", className)}>
        {getOrderStatusLabel(status)}
      </StatusBadge>
    );

    if (status === "CANCELLED") {
      return (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex cursor-default outline-none">
                {badge}
              </span>
            }
          />
          <TooltipContent side="bottom" className="max-w-[16rem] text-center">
            To reopen this order, please contact a Super Admin.
          </TooltipContent>
        </Tooltip>
      );
    }

    return badge;
  }

  async function applyStatus(
    next: OrderStatus,
    extra?: Pick<UpdateOrderPayload, "cancellationReason">,
  ) {
    setSaving(true);
    try {
      await onUpdate({ status: next, ...extra });
      toast.success(
        next === "CANCELLED" ? "Order cancelled" : "Order status updated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleChange(value: string | null) {
    if (!value) return;
    const next = value as OrderStatus;
    if (next === status) return;

    if (isRefundOrderStatus(next)) {
      toast.error(
        "This is a legacy refund order status. Choose a fulfillment status instead — refunds are managed separately.",
      );
      return;
    }

    if (next === "CANCELLED") {
      setCancelOpen(true);
      return;
    }

    try {
      await applyStatus(next);
    } catch {
      // toast already shown
    }
  }

  return (
    <>
      <Select
        value={status}
        onValueChange={(v) => void handleChange(v)}
        items={statusItems}
        disabled={saving}
      >
        <SelectTrigger
          className={cn(
            capsuleBase,
            capsuleVariantStyles[variant],
            className,
          )}
          aria-label="Order fulfillment status"
        >
          <SelectValue />
          {saving ? (
            <Loader2 className="size-3 shrink-0 animate-spin opacity-70" />
          ) : (
            <ChevronDown className="size-3 shrink-0 opacity-70" />
          )}
        </SelectTrigger>
        <SelectContent align="end">
          {statusItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderNumber={orderNumber}
        loading={saving}
        onConfirm={async (cancellationReason) => {
          await applyStatus("CANCELLED", { cancellationReason });
        }}
      />
    </>
  );
}
