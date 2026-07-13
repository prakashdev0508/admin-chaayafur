import { Ticket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CouponsPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Coupons"
        description="Create and manage discount codes for your store."
      />
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Ticket className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>Coupons coming soon</CardTitle>
          <CardDescription>
            Coupon management will be available in the next phase of the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
