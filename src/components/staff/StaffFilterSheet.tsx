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
import type { StaffFilters } from "@/lib/staff-filters";
import {
  ACTIVE_FILTER_ITEMS,
  STAFF_ROLE_FILTER_ITEMS,
} from "@/lib/select-items";

type StaffFilterSheetProps = {
  filters: StaffFilters;
  onApply: (filters: StaffFilters) => void;
  activeCount: number;
};

export function StaffFilterSheet({
  filters,
  onApply,
  activeCount,
}: StaffFilterSheetProps) {
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
          <SheetTitle>Filter staff</SheetTitle>
          <SheetDescription>
            Narrow by role, status, or email.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            onApply({
              role: String(form.get("role") ?? "all"),
              isActive: String(form.get("isActive") ?? "all"),
              email: String(form.get("email") ?? ""),
            });
          }}
        >
          <div className="space-y-2">
            <Label>Role</Label>
            <Select name="role" defaultValue={filters.role} items={STAFF_ROLE_FILTER_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ORDER_MANAGER">Order Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select name="isActive" defaultValue={filters.isActive} items={ACTIVE_FILTER_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              name="email"
              placeholder="Search by email..."
              defaultValue={filters.email}
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
