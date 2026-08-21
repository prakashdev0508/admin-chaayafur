import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { OrderFilters } from "@/lib/order-filters";
import {
  ORDER_STATUS_FILTER_ITEMS,
  ORDER_TYPE_FILTER_ITEMS,
  REFUND_STATUS_FILTER_ITEMS,
} from "@/lib/select-items";

type OrderFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: OrderFilters;
  onDraftChange: (filters: OrderFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

export function OrderFilterSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onApply,
  onClear,
}: OrderFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filter orders</SheetTitle>
          <SheetDescription>
            Narrow down by order type, status, refund status, order number,
            customer, or date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="order-type">Order type</Label>
            <Select
              value={draft.orderType}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, orderType: value });
              }}
              items={ORDER_TYPE_FILTER_ITEMS}
            >
              <SelectTrigger id="order-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-status">Order status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, status: value });
              }}
              items={ORDER_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger id="order-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-refund-status">Refund status</Label>
            <Select
              value={draft.refundStatus}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, refundStatus: value });
              }}
              items={REFUND_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger id="order-refund-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFUND_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-number">Order number</Label>
            <Input
              id="order-number"
              value={draft.orderNumber}
              onChange={(e) =>
                onDraftChange({ ...draft, orderNumber: e.target.value })
              }
              placeholder="e.g. ORD-20260714-0011"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Customer phone</Label>
            <Input
              id="customer-phone"
              value={draft.customerPhone}
              onChange={(e) =>
                onDraftChange({ ...draft, customerPhone: e.target.value })
              }
              placeholder="e.g. 98765"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-id">Customer ID</Label>
            <Input
              id="customer-id"
              value={draft.customerId}
              onChange={(e) =>
                onDraftChange({ ...draft, customerId: e.target.value })
              }
              placeholder="e.g. 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="created-from">Created from</Label>
              <Input
                id="created-from"
                type="date"
                value={draft.createdFrom}
                onChange={(e) =>
                  onDraftChange({ ...draft, createdFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created-to">Created to</Label>
              <Input
                id="created-to"
                type="date"
                value={draft.createdTo}
                onChange={(e) =>
                  onDraftChange({ ...draft, createdTo: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Clear
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
