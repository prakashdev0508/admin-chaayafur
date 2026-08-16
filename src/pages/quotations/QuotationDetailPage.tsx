import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  QUOTATION_STATUS_ITEMS,
  formatQuoteRupees,
  quotationStatusLabel,
  quotationStatusVariant,
  taxableAmount,
} from "@/lib/quotation";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import {
  addQuotationRemark,
  getQuotation,
  sendQuotationEmail,
  updateQuotation,
} from "@/services/quotations.service";
import type { QuotationStatus } from "@/types/quotation";

export function QuotationDetailPage() {
  const { id } = useParams();
  const quotationId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_QUOTATIONS);

  const [status, setStatus] = useState<QuotationStatus | "">("");
  const [remark, setRemark] = useState("");

  const { data: quotation, isLoading } = useQuery({
    queryKey: queryKeys.quotations.detail(quotationId),
    queryFn: () => getQuotation(quotationId),
    enabled: Number.isFinite(quotationId),
  });

  const displayedStatus = status || quotation?.status || "SENT";

  const statusMutation = useMutation({
    mutationFn: () =>
      updateQuotation(quotationId, { status: displayedStatus }),
    onSuccess: (updated) => {
      setStatus(updated.status);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.all,
      });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    },
  });

  const remarkMutation = useMutation({
    mutationFn: (text: string) => addQuotationRemark(quotationId, text),
    onSuccess: () => {
      setRemark("");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotationId),
      });
      toast.success("Remark added");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add remark",
      );
    },
  });

  const emailMutation = useMutation({
    mutationFn: () => sendQuotationEmail(quotationId),
    onSuccess: (result) => {
      toast.success(
        result.sent
          ? `Email sent to ${result.to}`
          : `Email skipped (mail disabled). Would send to ${result.to}`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
    },
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

  const remarks = quotation.followUpRemarks ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={quotation.quotationNumber}
        description={`${quotation.customerName} · ${formatPhone(quotation.mobileNumber)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {quotation.pdfUrl ? (
              <Button
                variant="outline"
                render={
                  <a
                    href={quotation.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open PDF
                  </a>
                }
              />
            ) : null}
            {canUpdate ? (
              <Button
                variant="outline"
                render={
                  <Link to={`/quotations/${quotation.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                }
              />
            ) : null}
            {canUpdate ? (
              <Button
                onClick={() => emailMutation.mutate()}
                disabled={emailMutation.isPending || !quotation.email}
              >
                {emailMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send email
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="text-right">{quotation.customerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mobile</span>
              <span>{formatPhone(quotation.mobileNumber)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="text-right">{quotation.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Valid until</span>
              <span>
                {formatDate(quotation.validUntil, {
                  dateStyle: "medium",
                  timeStyle: undefined,
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Address</span>
              <span className="max-w-[60%] text-right whitespace-pre-wrap">
                {quotation.address}
              </span>
            </div>
            {quotation.notes ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Notes</span>
                <span className="max-w-[60%] text-right whitespace-pre-wrap">
                  {quotation.notes}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(quotation.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
            <CardTitle>Status</CardTitle>
            <StatusBadge variant={quotationStatusVariant(quotation.status)}>
              {quotationStatusLabel(quotation.status)}
            </StatusBadge>
            </div>
            <CardDescription>
              {canUpdate
                ? "Update follow-up state for this quote."
                : "You can view status but need update-quotations to change it."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quotation status</Label>
              
              <Select
                value={displayedStatus}
                onValueChange={(value) => {
                  if (!value) return;
                  setStatus(value as QuotationStatus);
                }}
                items={QUOTATION_STATUS_ITEMS}
                disabled={!canUpdate || statusMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canUpdate ? (
              <Button
                disabled={
                  statusMutation.isPending ||
                  displayedStatus === quotation.status
                }
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? "Saving…" : "Save status"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Quoted prices snapshotted at save.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.productName}
                    {product.productId == null ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (removed from catalog)
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuoteRupees(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuoteRupees(product.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  Taxable
                </TableCell>
                <TableCell className="text-right">
                  {formatQuoteRupees(taxableAmount(Number(quotation.totalPrice)))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  GST
                </TableCell>
                <TableCell className="text-right">
                  {formatQuoteRupees(quotation.gstAmount)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(quotation.totalPrice)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up remarks</CardTitle>
          <CardDescription>Append-only notes on this quotation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {remarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No remarks yet.</p>
          ) : (
            <ul className="space-y-3">
              {remarks.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <p className="whitespace-pre-wrap">{item.remark}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {canUpdate ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const text = remark.trim();
                if (!text) {
                  toast.error("Enter a remark.");
                  return;
                }
                remarkMutation.mutate(text);
              }}
            >
              <Textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Called customer; will decide after Diwali"
                rows={3}
              />
              <Button
                type="submit"
                disabled={remarkMutation.isPending || !remark.trim()}
              >
                {remarkMutation.isPending ? "Adding…" : "Add remark"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
