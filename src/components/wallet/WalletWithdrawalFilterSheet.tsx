import { useState } from "react";
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
import type { WalletWithdrawalFilters } from "@/lib/wallet-filters";
import { WALLET_WITHDRAWAL_STATUS_FILTER_ITEMS } from "@/lib/select-items";
import type { WalletWithdrawalStatus } from "@/types/wallet";

type WalletWithdrawalFilterSheetProps = {
  filters: WalletWithdrawalFilters;
  onApply: (filters: WalletWithdrawalFilters) => void;
  activeCount: number;
};

export function WalletWithdrawalFilterSheet({
  filters,
  onApply,
  activeCount,
}: WalletWithdrawalFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <SheetTitle>Filter withdrawals</SheetTitle>
          <SheetDescription>
            Narrow by status or customer ID.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onApply({
              status: String(data.get("status") ?? "all") as
                | WalletWithdrawalStatus
                | "all",
              customerId: String(data.get("customerId") ?? ""),
            });
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="withdrawal-status">Status</Label>
            <Select
              name="status"
              defaultValue={filters.status}
              items={WALLET_WITHDRAWAL_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger id="withdrawal-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALLET_WITHDRAWAL_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-customer-id">Customer ID</Label>
            <Input
              id="withdrawal-customer-id"
              name="customerId"
              placeholder="e.g. 12"
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
