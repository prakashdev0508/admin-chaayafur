import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  defaultOrderFilters,
  type OrderFilters,
} from "@/lib/order-filters";
import { getOrderStatusLabel } from "@/lib/order-status";

type ActiveFilterChip = {
  key: keyof OrderFilters;
  label: string;
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  CHECKOUT: "Checkout",
  MANUAL: "Manual",
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function getActiveFilterChips(filters: OrderFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.orderType !== "all") {
    chips.push({
      key: "orderType",
      label: `Type: ${ORDER_TYPE_LABELS[filters.orderType] ?? filters.orderType}`,
    });
  }

  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: `Status: ${getOrderStatusLabel(filters.status)}`,
    });
  }

  if (filters.refundStatus !== "all") {
    chips.push({
      key: "refundStatus",
      label: `Refund: ${REFUND_STATUS_LABELS[filters.refundStatus] ?? filters.refundStatus}`,
    });
  }

  if (filters.orderNumber.trim()) {
    chips.push({
      key: "orderNumber",
      label: `Order: ${filters.orderNumber.trim()}`,
    });
  }

  if (filters.customerPhone.trim()) {
    chips.push({
      key: "customerPhone",
      label: `Phone: ${filters.customerPhone.trim()}`,
    });
  }

  if (filters.customerId.trim()) {
    chips.push({
      key: "customerId",
      label: `Customer ID: ${filters.customerId.trim()}`,
    });
  }

  if (filters.createdFrom.trim()) {
    chips.push({
      key: "createdFrom",
      label: `From: ${filters.createdFrom.trim()}`,
    });
  }

  if (filters.createdTo.trim()) {
    chips.push({
      key: "createdTo",
      label: `To: ${filters.createdTo.trim()}`,
    });
  }

  return chips;
}

type OrderActiveFiltersProps = {
  filters: OrderFilters;
  onRemove: (key: keyof OrderFilters) => void;
  onClearAll: () => void;
};

export function OrderActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: OrderActiveFiltersProps) {
  const chips = getActiveFilterChips(filters);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}

export function removeOrderFilter(
  filters: OrderFilters,
  key: keyof OrderFilters,
): OrderFilters {
  return { ...filters, [key]: defaultOrderFilters[key] };
}
