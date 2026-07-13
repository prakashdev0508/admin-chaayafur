import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuditLogsPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit Logs"
        description="Field-level audit trail for staff changes."
      />
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ScrollText className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>Audit logs coming soon</CardTitle>
          <CardDescription>
            Audit log viewer will be available in the next phase of the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
