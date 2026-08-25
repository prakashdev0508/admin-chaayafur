import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PurchaseOrderItemPicker } from "@/components/purchase-orders/PurchaseOrderItemPicker";
import { PurchaseOrderLineItemsEditor } from "@/components/purchase-orders/PurchaseOrderLineItemsEditor";
import { PurchaseOrderPreview } from "@/components/purchase-orders/PurchaseOrderPreview";
import { PurchaseOrderPreviewDialog } from "@/components/purchase-orders/PurchaseOrderPreviewDialog";
import { PurchaseOrderTermsEditor } from "@/components/purchase-orders/PurchaseOrderTermsEditor";
import { PurchaseOrderVendorFields } from "@/components/purchase-orders/PurchaseOrderVendorFields";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PO_COMPANY_NAME,
  createPurchaseOrderDraft,
  purchaseOrderTotals,
  formatPoRupees,
  validatePurchaseOrderDraft,
} from "@/lib/purchase-order";
import { downloadPurchaseOrderPdf } from "@/lib/purchase-order-pdf";
import { queryKeys } from "@/lib/query-keys";
import { fetchPublicSiteSettings } from "@/services/site-settings.service";
import type { Order } from "@/types/order";
import type {
  PurchaseOrderCompanyInfo,
  PurchaseOrderDraft,
} from "@/types/purchase-order";

type PurchaseOrderEditorProps = {
  order: Order;
};

export function PurchaseOrderEditor({ order }: PurchaseOrderEditorProps) {
  const settingsQuery = useQuery({
    queryKey: queryKeys.shop.siteSettings,
    queryFn: fetchPublicSiteSettings,
  });

  const [draft, setDraft] = useState<PurchaseOrderDraft>(() =>
    createPurchaseOrderDraft(order, null),
  );
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsQuery.data || settingsApplied) return;
    setDraft(createPurchaseOrderDraft(order, settingsQuery.data));
    setSettingsApplied(true);
  }, [order, settingsQuery.data, settingsApplied]);

  const company = useMemo<PurchaseOrderCompanyInfo>(() => {
    const settings = settingsQuery.data;
    return {
      name: PO_COMPANY_NAME,
      logoUrl: settings?.logoUrl ?? null,
      phone: settings?.phone ?? null,
      email: settings?.email ?? null,
      showroomAddress: settings?.showroomAddress ?? null,
      gstin: settings?.gstin ?? null,
    };
  }, [settingsQuery.data]);

  const totals = purchaseOrderTotals(draft.items);

  function patchDraft(patch: Partial<PurchaseOrderDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleReset() {
    setDraft(createPurchaseOrderDraft(order, settingsQuery.data ?? null));
  }

  async function handleDownload() {
    const error = validatePurchaseOrderDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setDownloading(true);
    try {
      await downloadPurchaseOrderPdf(draft, company, sheetRef.current);
      toast.success("Purchase order PDF downloaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate the PDF",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader
        title="Create purchase order"
        description={`Order ${order.orderNumber}. Select items, add vendor details, then preview or download the PDF. Nothing is saved to the server.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              render={
                <Link to={`/orders/${order.id}`}>
                  <ArrowLeft />
                  Back
                </Link>
              }
            />
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDownload()}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye />
              Preview
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Vendor & parties</CardTitle>
            <CardDescription>
              PO {draft.poNumber}. Vendor name is required. Ship To / Bill To
              are prefilled from site settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderVendorFields draft={draft} onChange={patchDraft} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order items</CardTitle>
            <CardDescription>
              Choose which lines from this order to include on the purchase
              order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderItemPicker
              orderItems={order.items}
              selectedLines={draft.items}
              onChange={(items) => patchDraft({ items })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PO line details</CardTitle>
            <CardDescription>
              Adjust HSN, dates, discount, and tax rates. Net{" "}
              {formatPoRupees(totals.netAmount)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderLineItemsEditor
              items={draft.items}
              onChange={(items) => patchDraft({ items })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms & conditions</CardTitle>
            <CardDescription>
              Add multiple terms. They appear as bullets at the bottom of the
              purchase order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderTermsEditor
              terms={draft.terms}
              onChange={(terms) => patchDraft({ terms })}
            />
          </CardContent>
        </Card>
      </div>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-210mm",
          top: 0,
          zIndex: -1,
          width: "210mm",
          pointerEvents: "none",
        }}
      >
        <div
          ref={sheetRef}
          data-purchase-order-sheet
          style={{ width: "210mm" }}
        >
          <PurchaseOrderPreview draft={draft} company={company} />
        </div>
      </div>

      <PurchaseOrderPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        draft={draft}
        company={company}
        downloading={downloading}
        onDownload={() => void handleDownload()}
      />
    </div>
  );
}
