import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { QuotationEditor } from "@/components/quotations/QuotationEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { getQuotation } from "@/services/quotations.service";

export function EditQuotationPage() {
  const { id } = useParams();
  const quotationId = Number(id);

  const { data: quotation, isLoading } = useQuery({
    queryKey: queryKeys.quotations.detail(quotationId),
    queryFn: () => getQuotation(quotationId),
    enabled: Number.isFinite(quotationId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Quotation not found" />
        <Button
          variant="outline"
          render={<Link to="/quotations">Back to quotations</Link>}
        />
      </div>
    );
  }

  return <QuotationEditor mode="edit" quotation={quotation} />;
}
