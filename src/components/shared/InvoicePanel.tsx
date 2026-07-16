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
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Mail, RefreshCw } from "lucide-react";

type InvoicePanelProps = {
  invoice?: Invoice;
  loading?: boolean;
  notFound?: boolean;
  canGenerate?: boolean;
  generating?: boolean;
  emailing?: boolean;
  onGenerate?: () => void;
  onEmail?: () => void;
};

export function InvoicePanel({
  invoice,
  loading,
  notFound,
  canGenerate,
  generating,
  emailing,
  onGenerate,
  onEmail,
}: InvoicePanelProps) {
  const busy = Boolean(generating || emailing);

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
            ? "No invoice exists yet. Generate a PDF snapshot, or email one to the customer (creates the invoice if needed)."
            : "No invoice exists for this order yet."
        }
        action={
          canGenerate ? (
            <div className="flex flex-wrap justify-center gap-2">
              {onGenerate && (
                <Button onClick={onGenerate} disabled={busy}>
                  {generating ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate invoice"
                  )}
                </Button>
              )}
              {onEmail && (
                <Button variant="outline" onClick={onEmail} disabled={busy}>
                  {emailing ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      Email invoice
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    );
  }

  if (!invoice) {
    return null;
  }

  const hasPdf = Boolean(invoice.pdfUrl);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Invoice number</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {invoice.invoiceNumber}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(invoice.issuedAt)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 text-sm font-semibold">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">PDF</p>
              <p className="mt-1 text-sm font-medium">
                {hasPdf ? "Available" : "Not generated"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasPdf ? (
                <Button
                  variant="outline"
                  size="icon"
                  title="Download PDF"
                  render={
                    <a
                      href={invoice.pdfUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Download invoice PDF"
                    >
                      <Download className="size-4" />
                    </a>
                  }
                />
              ) : canGenerate && onGenerate ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onGenerate}
                  disabled={busy}
                  title={generating ? "Generating PDF…" : "Generate PDF"}
                  aria-label={generating ? "Generating PDF" : "Generate PDF"}
                >
                  <RefreshCw
                    className={`size-4 ${generating ? "animate-spin" : ""}`}
                  />
                </Button>
              ) : null}

              {canGenerate && onGenerate && hasPdf && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGenerate}
                  disabled={busy}
                  title={generating ? "Regenerating…" : "Regenerate PDF"}
                  aria-label={generating ? "Regenerating PDF" : "Regenerate PDF"}
                >
                  <RefreshCw
                    className={`size-4 ${generating ? "animate-spin" : ""}`}
                  />
                </Button>
              )}

              {canGenerate && onEmail && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onEmail}
                  disabled={busy}
                  title={emailing ? "Sending…" : "Email invoice PDF"}
                  aria-label={emailing ? "Emailing invoice" : "Email invoice"}
                >
                  {emailing ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
