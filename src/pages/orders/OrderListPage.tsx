import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { orderColumns } from "@/components/data-table/order-columns";
import { mockOrders } from "@/data/mockOrders";

export function OrderListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || order.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Orders"
        description="Track and fulfill customer orders from your store."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="order-search">Search</Label>
              <Input
                id="order-search"
                placeholder="Search by order number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-full">
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
          </div>
        </CardContent>
      </Card>

      <DataTable columns={orderColumns} data={filteredOrders} />
    </div>
  );
}
