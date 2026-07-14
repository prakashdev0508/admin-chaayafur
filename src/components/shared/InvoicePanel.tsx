import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Download, FileText, RefreshCw } from "lucide-react";

type InvoicePanelProps = {
  invoice?: Invoice;
  loading?: boolean;
  notFound?: boolean;
  canGenerate?: boolean;
  generating?: boolean;
  onGenerate?: () => void;
};

export function InvoicePanel({
  invoice,
  loading,
  notFound,
  canGenerate,
  generating,
  onGenerate,
}: InvoicePanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon={FileText}
        title="Invoice not available"
        description={
          canGenerate
            ? "No invoice exists yet. Generate a snapshot and PDF for this order."
            : "Invoice is generated when the order is confirmed."
        }
        action={
          canGenerate && onGenerate ? (
            <Button onClick={onGenerate} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate invoice"
              )}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Invoice number</p>
          <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Issued</p>
            <p className="text-sm">{formatDate(invoice.issuedAt)}</p>
          </div>
          {invoice.pdfUrl ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Download PDF
                </a>
              }
            />
          ) : canGenerate && onGenerate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                "Generate PDF"
              )}
            </Button>
          ) : null}
          {canGenerate && onGenerate && invoice.pdfUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Regenerate
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">{invoice.billingName}</p>
        <p className="text-sm text-muted-foreground">{invoice.billingAddress}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lineItems.map((item) => (
              <TableRow key={`${item.productId}-${item.name}`}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {invoice.discountAmount && parseFloat(invoice.discountAmount) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-[#346538]">
              -{formatCurrency(invoice.discountAmount)}
            </span>
          </div>
        )}
        {invoice.shippingAmount != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {parseFloat(invoice.shippingAmount) === 0
                ? "Free"
                : formatCurrency(invoice.shippingAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(invoice.taxAmount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(invoice.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
