import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { RefundFilters } from "@/lib/refund-filters";
import { REFUND_STATUS_FILTER_ITEMS } from "@/lib/select-items";
import type { RefundStatus } from "@/types/refund";

type RefundFilterSheetProps = {
  filters: RefundFilters;
  onApply: (filters: RefundFilters) => void;
  activeCount: number;
};

export function RefundFilterSheet({
  filters,
  onApply,
  activeCount,
}: RefundFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline">
            <Filter className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-md bg-primary/10 px-1.5 text-xs text-primary">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter refunds</SheetTitle>
          <SheetDescription>
            Narrow by refund status, order, or created date.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onApply({
              status: String(data.get("status") ?? "all") as
                | RefundStatus
                | "all",
              orderId: String(data.get("orderId") ?? ""),
              orderNumber: String(data.get("orderNumber") ?? ""),
              createdFrom: String(data.get("createdFrom") ?? ""),
              createdTo: String(data.get("createdTo") ?? ""),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="refund-status">Status</Label>
            <Select
              name="status"
              defaultValue={filters.status}
              items={REFUND_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger id="refund-status" className="w-full">
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
            <Label htmlFor="refund-order-number">Order number</Label>
            <Input
              id="refund-order-number"
              name="orderNumber"
              placeholder="e.g. ORD-20260714-0011"
              defaultValue={filters.orderNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-order-id">Order ID</Label>
            <Input
              id="refund-order-id"
              name="orderId"
              placeholder="e.g. 12"
              defaultValue={filters.orderId}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="refund-from">Created from</Label>
              <Input
                id="refund-from"
                name="createdFrom"
                type="date"
                defaultValue={filters.createdFrom}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-to">Created to</Label>
              <Input
                id="refund-to"
                name="createdTo"
                type="date"
                defaultValue={filters.createdTo}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button type="submit">Apply filters</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
