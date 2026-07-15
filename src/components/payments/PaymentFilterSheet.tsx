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
import type { PaymentFilters } from "@/lib/payment-filters";
import { PAYMENT_STATUS_FILTER_ITEMS } from "@/lib/select-items";

type PaymentFilterSheetProps = {
  filters: PaymentFilters;
  onApply: (filters: PaymentFilters) => void;
  activeCount: number;
};

export function PaymentFilterSheet({
  filters,
  onApply,
  activeCount,
}: PaymentFilterSheetProps) {
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
          <SheetTitle>Filter payments</SheetTitle>
          <SheetDescription>
            Filter by status, order, customer, or date.
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
              orderId: String(data.get("orderId") ?? ""),
              customerId: String(data.get("customerId") ?? ""),
              orderNumber: String(data.get("orderNumber") ?? ""),
              customerPhone: String(data.get("customerPhone") ?? ""),
              createdFrom: String(data.get("createdFrom") ?? ""),
              createdTo: String(data.get("createdTo") ?? ""),
            });
          }}
        >
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              name="status"
              defaultValue={filters.status}
              items={PAYMENT_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-order-number">Order number</Label>
            <Input
              id="pay-order-number"
              name="orderNumber"
              placeholder="e.g. ORD-20260714-0011"
              defaultValue={filters.orderNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-id">Order ID</Label>
            <Input
              id="order-id"
              name="orderId"
              placeholder="e.g. 7"
              defaultValue={filters.orderId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-customer-phone">Customer phone</Label>
            <Input
              id="pay-customer-phone"
              name="customerPhone"
              placeholder="e.g. 98765"
              defaultValue={filters.customerPhone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-customer-id">Customer ID</Label>
            <Input
              id="pay-customer-id"
              name="customerId"
              placeholder="e.g. 1"
              defaultValue={filters.customerId}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pay-created-from">Created from</Label>
              <Input
                id="pay-created-from"
                name="createdFrom"
                type="date"
                defaultValue={filters.createdFrom}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-created-to">Created to</Label>
              <Input
                id="pay-created-to"
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
