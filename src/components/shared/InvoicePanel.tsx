import { formatCurrency, formatDate } from "@/lib/format";
import { formatPriceAdjustment } from "@/lib/customization-pricing";
import type {
  Invoice,
  InvoiceGenerateType,
  OrderInvoices,
} from "@/types/invoice";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Download, FileText, Mail, RefreshCw } from "lucide-react";

function invoiceLineCustomizationLabel(item: Invoice["lineItems"][number]) {
  const parts: string[] = [];
  if (item.woodName) {
    const adj = formatPriceAdjustment(item.woodPriceAdjustment);
    parts.push(adj ? `${item.woodName} (${adj})` : item.woodName);
  }
  if (item.polishName) {
    const adj = formatPriceAdjustment(item.polishPriceAdjustment);
    parts.push(adj ? `${item.polishName} (${adj})` : item.polishName);
  }
  if (item.fabricName) {
    const adj = formatPriceAdjustment(item.fabricPriceAdjustment);
    parts.push(adj ? `${item.fabricName} (${adj})` : item.fabricName);
  }
  return parts.length > 0 ? parts.join(" / ") : null;
}

type InvoiceSectionProps = {
  title: string;
  description: string;
  invoiceType: InvoiceGenerateType;
  invoice: Invoice | null;
  canGenerate?: boolean;
  generating?: boolean;
  emailing?: boolean;
  showEmail?: boolean;
  onGenerate?: (invoiceType: InvoiceGenerateType) => void;
  onEmail?: () => void;
};

function InvoiceSection({
  title,
  description,
  invoiceType,
  invoice,
  canGenerate,
  generating,
  emailing,
  showEmail,
  onGenerate,
  onEmail,
}: InvoiceSectionProps) {
  const busy = Boolean(generating || emailing);

  if (!invoice) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            <StatusBadge variant="neutral">Not generated</StatusBadge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          {canGenerate && onGenerate ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => onGenerate(invoiceType)}
                disabled={busy}
              >
                {generating ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileText className="size-4" />
                    Generate {title.toLowerCase()}
                  </>
                )}
              </Button>
              {showEmail && onEmail && (
                <Button variant="outline" onClick={onEmail} disabled={busy}>
                  {emailing ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      Email tax invoice
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No {title.toLowerCase()} exists for this order yet.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const hasPdf = Boolean(invoice.pdfUrl);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <StatusBadge variant="success">
            {invoice.invoiceType === "PERFORMA" ? "Performa" : "Tax"}
          </StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Invoice number</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(invoice.issuedAt)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 text-sm font-semibold">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">PDF</p>
              <p className="mt-1 text-sm font-medium">
                {hasPdf ? "Available" : "Not generated"}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {hasPdf ? (
                <Button
                  variant="outline"
                  className="min-h-11 w-full justify-start gap-2 sm:w-auto sm:justify-center sm:px-3"
                  render={
                    <a
                      href={invoice.pdfUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Download ${title} PDF`}
                    >
                      <Download className="size-4" />
                      <span className="sm:sr-only">Download PDF</span>
                    </a>
                  }
                />
              ) : canGenerate && onGenerate ? (
                <Button
                  variant="outline"
                  className="min-h-11 w-full justify-start gap-2 sm:w-auto sm:justify-center sm:px-3"
                  onClick={() => onGenerate(invoiceType)}
                  disabled={busy}
                  title={generating ? "Generating PDF…" : "Generate PDF"}
                  aria-label={generating ? "Generating PDF" : "Generate PDF"}
                >
                  <RefreshCw
                    className={`size-4 ${generating ? "animate-spin" : ""}`}
                  />
                  <span className="sm:sr-only">
                    {generating ? "Generating…" : "Generate PDF"}
                  </span>
                </Button>
              ) : null}

              {canGenerate && onGenerate && hasPdf && (
                <Button
                  variant="ghost"
                  className="min-h-11 w-full justify-start gap-2 sm:w-auto sm:justify-center sm:px-3"
                  onClick={() => onGenerate(invoiceType)}
                  disabled={busy}
                  title={generating ? "Regenerating…" : "Regenerate PDF"}
                  aria-label={
                    generating ? "Regenerating PDF" : "Regenerate PDF"
                  }
                >
                  <RefreshCw
                    className={`size-4 ${generating ? "animate-spin" : ""}`}
                  />
                  <span className="sm:sr-only">
                    {generating ? "Regenerating…" : "Regenerate PDF"}
                  </span>
                </Button>
              )}

              {showEmail && canGenerate && onEmail && (
                <Button
                  variant="outline"
                  className="min-h-11 w-full justify-start gap-2 sm:w-auto sm:justify-center sm:px-3"
                  onClick={onEmail}
                  disabled={busy}
                  title={emailing ? "Sending…" : "Email tax invoice PDF"}
                  aria-label={
                    emailing ? "Emailing tax invoice" : "Email tax invoice"
                  }
                >
                  {emailing ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  <span className="sm:sr-only">
                    {emailing ? "Sending…" : "Email tax invoice"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">{invoice.billingName}</p>
          <p className="text-sm text-muted-foreground">
            {invoice.billingAddress}
          </p>
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
              {invoice.lineItems.map((item) => {
                const customization = invoiceLineCustomizationLabel(item);
                return (
                  <TableRow key={`${item.productId}-${item.name}`}>
                    <TableCell>
                      <div>{item.name}</div>
                      {item.hsnCode && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          HSN {item.hsnCode}
                        </p>
                      )}
                      {customization && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {customization}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount &&
            parseFloat(invoice.discountAmount) > 0 && (
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
          {invoice.floorDeliveryAmount != null &&
            parseFloat(invoice.floorDeliveryAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Floor delivery
                  {invoice.deliveryFloor != null
                    ? ` (floor ${invoice.deliveryFloor})`
                    : ""}
                </span>
                <span>{formatCurrency(invoice.floorDeliveryAmount)}</span>
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
      </CardContent>
    </Card>
  );
}

type InvoicePanelProps = {
  invoices?: OrderInvoices;
  loading?: boolean;
  notFound?: boolean;
  canGenerate?: boolean;
  generatingType?: InvoiceGenerateType | null;
  emailing?: boolean;
  onGenerate?: (invoiceType: InvoiceGenerateType) => void;
  onEmail?: () => void;
};

export function InvoicePanel({
  invoices,
  loading,
  notFound,
  canGenerate,
  generatingType,
  emailing,
  onGenerate,
  onEmail,
}: InvoicePanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (notFound || (!invoices?.performa && !invoices?.tax)) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={FileText}
          title="Invoices not available"
          description={
            canGenerate
              ? "No invoices exist yet. Generate a Performa invoice after payment, or a Tax invoice after delivery. Emailing creates the tax invoice if needed."
              : "No invoices exist for this order yet."
          }
          action={
            canGenerate ? (
              <div className="flex flex-wrap justify-center gap-2">
                {onGenerate && (
                  <>
                    <Button
                      onClick={() => onGenerate("pf")}
                      disabled={Boolean(generatingType) || emailing}
                    >
                      {generatingType === "pf" ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        "Generate Performa"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onGenerate("txi")}
                      disabled={Boolean(generatingType) || emailing}
                    >
                      {generatingType === "txi" ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        "Generate Tax"
                      )}
                    </Button>
                  </>
                )}
                {onEmail && (
                  <Button
                    variant="outline"
                    onClick={onEmail}
                    disabled={Boolean(generatingType) || emailing}
                  >
                    {emailing ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="size-4" />
                        Email tax invoice
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InvoiceSection
        title="Performa invoice"
        description="Issued when payment is received (order confirmed)."
        invoiceType="pf"
        invoice={invoices.performa}
        canGenerate={canGenerate}
        generating={generatingType === "pf"}
        emailing={emailing}
        onGenerate={onGenerate}
      />
      <InvoiceSection
        title="Tax invoice"
        description="Issued when the order is delivered. Email sends this PDF to the customer."
        invoiceType="txi"
        invoice={invoices.tax}
        canGenerate={canGenerate}
        generating={generatingType === "txi"}
        emailing={emailing}
        showEmail
        onGenerate={onGenerate}
        onEmail={onEmail}
      />
    </div>
  );
}
