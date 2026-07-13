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
import { paymentColumns } from "@/components/data-table/payment-columns";
import { mockPayments } from "@/data/mockPayments";

export function PaymentListPage() {
  const [status, setStatus] = useState("all");
  const [orderId, setOrderId] = useState("");

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const matchesStatus = status === "all" || payment.status === status;
      const matchesOrder =
        orderId === "" || payment.orderId === Number(orderId);
      return matchesStatus && matchesOrder;
    });
  }, [status, orderId]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Payments"
        description="View payment transactions and Razorpay payment links."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-id">Order ID</Label>
              <Input
                id="order-id"
                type="number"
                placeholder="Filter by order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={paymentColumns} data={filteredPayments} />
    </div>
  );
}
