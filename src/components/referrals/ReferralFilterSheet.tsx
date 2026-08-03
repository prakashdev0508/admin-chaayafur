import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { ReferralFilters } from "@/lib/referral-filters";
import { REFERRAL_STATUS_FILTER_ITEMS } from "@/lib/select-items";
import type { ReferralStatus } from "@/types/referral";

type ReferralFilterSheetProps = {
  filters: ReferralFilters;
  onApply: (filters: ReferralFilters) => void;
  activeCount: number;
};

export function ReferralFilterSheet({
  filters,
  onApply,
  activeCount,
}: ReferralFilterSheetProps) {
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
          <SheetTitle>Filter referrals</SheetTitle>
          <SheetDescription>
            Narrow by referral commission status.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onApply({
              status: String(data.get("status") ?? "all") as
                | ReferralStatus
                | "all",
            });
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="referral-status">Status</Label>
            <Select
              name="status"
              defaultValue={filters.status}
              items={REFERRAL_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger id="referral-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_STATUS_FILTER_ITEMS.map((item) => (
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
