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
import type { OrderFilters } from "@/lib/order-filters";
import { ORDER_STATUS_FILTER_ITEMS } from "@/lib/select-items";

type OrderFilterSheetProps = {
  filters: OrderFilters;
  onApply: (filters: OrderFilters) => void;
  activeCount: number;
};

export function OrderFilterSheet({
  filters,
  onApply,
  activeCount,
}: OrderFilterSheetProps) {
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
          <SheetTitle>Filter orders</SheetTitle>
          <SheetDescription>
            Narrow down orders by status or customer.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            onApply({
              status: String(data.get("status") ?? "all"),
              customerId: String(data.get("customerId") ?? ""),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <Select name="status" defaultValue={filters.status} items={ORDER_STATUS_FILTER_ITEMS}>
              <SelectTrigger id="order-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-id">Customer ID</Label>
            <Input
              id="customer-id"
              name="customerId"
              placeholder="e.g. 1"
              defaultValue={filters.customerId}
            />
          </div>
          <SheetFooter className="mt-auto">
            <Button type="submit">Apply filters</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
