import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { orderItemLabel, orderItemToPoLine } from "@/lib/purchase-order";
import type { OrderItem } from "@/types/order";
import type { PurchaseOrderLine } from "@/types/purchase-order";

type PurchaseOrderItemPickerProps = {
  orderItems: OrderItem[];
  selectedLines: PurchaseOrderLine[];
  onChange: (lines: PurchaseOrderLine[]) => void;
};

export function PurchaseOrderItemPicker({
  orderItems,
  selectedLines,
  onChange,
}: PurchaseOrderItemPickerProps) {
  const selectedIds = new Set(
    selectedLines
      .map((line) => line.orderItemId)
      .filter((id): id is number => id != null),
  );
  const allSelected =
    orderItems.length > 0 && orderItems.every((item) => selectedIds.has(item.id));

  function toggleAll(checked: boolean) {
    if (checked) {
      onChange(orderItems.map(orderItemToPoLine));
      return;
    }
    onChange([]);
  }

  function toggleItem(item: OrderItem, checked: boolean) {
    if (checked) {
      if (selectedIds.has(item.id)) return;
      onChange([...selectedLines, orderItemToPoLine(item)]);
      return;
    }
    onChange(selectedLines.filter((line) => line.orderItemId !== item.id));
  }

  if (orderItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order has no line items to include.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="po-select-all"
          checked={allSelected}
          onCheckedChange={(value) => toggleAll(Boolean(value))}
        />
        <Label htmlFor="po-select-all" className="text-sm font-medium">
          Select all ({selectedLines.length} of {orderItems.length})
        </Label>
      </div>
      <ul className="divide-y rounded-lg border">
        {orderItems.map((item) => {
          const checked = selectedIds.has(item.id);
          const label = orderItemLabel(item);
          return (
            <li key={item.id} className="flex items-start gap-3 px-3 py-3">
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => toggleItem(item, Boolean(value))}
                className="mt-0.5"
                aria-label={`Select ${label}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  Qty {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(parseFloat(item.price) * item.quantity)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
