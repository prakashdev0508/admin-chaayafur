import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CustomersPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Customers"
        description="View and manage customer accounts and addresses."
      />
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>Customers coming soon</CardTitle>
          <CardDescription>
            Customer management will be available in the next phase of the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
