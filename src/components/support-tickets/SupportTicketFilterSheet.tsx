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
import type { SupportTicketFilters } from "@/lib/support-ticket-filters";

type SupportTicketFilterSheetProps = {
  filters: SupportTicketFilters;
  onApply: (filters: SupportTicketFilters) => void;
  activeCount: number;
};

export function SupportTicketFilterSheet({
  filters,
  onApply,
  activeCount,
}: SupportTicketFilterSheetProps) {
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
          <SheetTitle>Filter support tickets</SheetTitle>
          <SheetDescription>
            Narrow tickets by status, type, order, or customer.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            onApply({
              status: String(data.get("status") ?? "all") as SupportTicketFilters["status"],
              type: String(data.get("type") ?? "all") as SupportTicketFilters["type"],
              q: String(data.get("q") ?? ""),
              orderId: String(data.get("orderId") ?? ""),
              customerId: String(data.get("customerId") ?? ""),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ticket-search">Search</Label>
            <Input
              id="ticket-search"
              name="q"
              defaultValue={filters.q}
              placeholder="Ticket number or subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-status">Status</Label>
            <Select name="status" defaultValue={filters.status}>
              <SelectTrigger id="ticket-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="AWAITING_STAFF">Awaiting staff</SelectItem>
                <SelectItem value="AWAITING_CUSTOMER">Awaiting customer</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-type">Type</Label>
            <Select name="type" defaultValue={filters.type}>
              <SelectTrigger id="ticket-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="QUESTION">Question</SelectItem>
                <SelectItem value="PROBLEM">Problem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-order-id">Order ID</Label>
            <Input
              id="ticket-order-id"
              name="orderId"
              defaultValue={filters.orderId}
              placeholder="7"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-customer-id">Customer ID</Label>
            <Input
              id="ticket-customer-id"
              name="customerId"
              defaultValue={filters.customerId}
              placeholder="3"
            />
          </div>
          <SheetFooter>
            <Button type="submit">Apply filters</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
