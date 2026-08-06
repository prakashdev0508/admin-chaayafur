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
import { usePermission } from "@/hooks/usePermission";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  isRefundOrderStatus,
} from "@/lib/order-status";
import { PERMISSIONS } from "@/lib/roles";
import { toOrderStatusSelectItems } from "@/lib/select-items";
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
  onUpdate: (payload: UpdateOrderPayload) => Promise<unknown>;
  className?: string;
};

export function OrderStatusSelect({
  status,
  onUpdate,
  className,
}: OrderStatusSelectProps) {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_ORDERS);
  const [saving, setSaving] = useState(false);

  const statusItems = useMemo(
    () => toOrderStatusSelectItems(status),
    [status],
  );
  const variant = getOrderStatusVariant(status);

  if (!canUpdate) {
    return (
      <StatusBadge variant={variant} className={cn("h-7 px-2.5", className)}>
        {getOrderStatusLabel(status)}
      </StatusBadge>
    );
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

    setSaving(true);
    try {
      await onUpdate({ status: next });
      toast.success("Order status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
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
  );
}
