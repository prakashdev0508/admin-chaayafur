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
import type { CartFilters } from "@/lib/cart-filters";

const HAS_ITEMS_OPTIONS = [
  { value: "all", label: "All carts" },
  { value: "true", label: "With items" },
  { value: "false", label: "Empty only" },
];

type CartFilterSheetProps = {
  filters: CartFilters;
  onApply: (filters: CartFilters) => void;
  activeCount: number;
};

export function CartFilterSheet({
  filters,
  onApply,
  activeCount,
}: CartFilterSheetProps) {
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
          <SheetTitle>Filter carts</SheetTitle>
          <SheetDescription>
            Narrow by customer phone, customer ID, or whether the cart has items.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onApply({
              customerPhone: String(data.get("customerPhone") ?? ""),
              customerId: String(data.get("customerId") ?? ""),
              hasItems: String(data.get("hasItems") ?? "all") as
                | "all"
                | "true"
                | "false",
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="cart-phone">Customer phone</Label>
            <Input
              id="cart-phone"
              name="customerPhone"
              placeholder="98765"
              defaultValue={filters.customerPhone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cart-customer-id">Customer ID</Label>
            <Input
              id="cart-customer-id"
              name="customerId"
              placeholder="5"
              defaultValue={filters.customerId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cart-has-items">Items</Label>
            <Select
              name="hasItems"
              defaultValue={filters.hasItems}
              items={HAS_ITEMS_OPTIONS}
            >
              <SelectTrigger id="cart-has-items" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HAS_ITEMS_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetFooter className="mt-auto">
            <Button type="submit">Apply filters</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
