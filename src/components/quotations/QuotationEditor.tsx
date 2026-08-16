import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { QuotationCustomerFields } from "@/components/quotations/QuotationCustomerFields";
import { QuotationLineItemsEditor } from "@/components/quotations/QuotationLineItemsEditor";
import { QuotationPreview } from "@/components/quotations/QuotationPreview";
import { QuotationPreviewDialog } from "@/components/quotations/QuotationPreviewDialog";
import { QuotationSaveProgressDialog } from "@/components/quotations/QuotationSaveProgressDialog";
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
  QUOTATION_COMPANY_NAME,
  createEmptyQuotationDraft,
  draftToCreatePayload,
  quotationToDraft,
  validateQuotationDraft,
} from "@/lib/quotation";
import {
  buildQuotationPdfBlob,
  downloadQuotationPdf,
} from "@/lib/quotation-pdf";
import { queryKeys } from "@/lib/query-keys";
import { fetchPublicSiteSettings } from "@/services/site-settings.service";
import {
  createQuotation,
  updateQuotation,
  uploadQuotationPdf,
} from "@/services/quotations.service";
import type {
  Quotation,
  QuotationCompanyInfo,
  QuotationDraft,
} from "@/types/quotation";

type QuotationEditorProps =
  | { mode: "create"; quotation?: undefined }
  | { mode: "edit"; quotation: Quotation };

export function QuotationEditor({ mode, quotation }: QuotationEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<QuotationDraft>(() =>
    quotation ? quotationToDraft(quotation) : createEmptyQuotationDraft(),
  );
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const settingsQuery = useQuery({
    queryKey: queryKeys.shop.siteSettings,
    queryFn: fetchPublicSiteSettings,
  });

  const company = useMemo<QuotationCompanyInfo>(() => {
    const settings = settingsQuery.data;
    return {
      name: QUOTATION_COMPANY_NAME,
      logoUrl: settings?.logoUrl ?? null,
      phone: settings?.phone ?? null,
      email: settings?.email ?? null,
      showroomAddress: settings?.showroomAddress ?? null,
      gstin: settings?.gstin ?? null,
    };
  }, [settingsQuery.data]);

  const backTo =
    mode === "edit" ? `/quotations/${quotation.id}` : "/quotations";

  function patchDraft(patch: Partial<QuotationDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handleDownload() {
    const error = validateQuotationDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setDownloading(true);
    try {
      await downloadQuotationPdf(draft, company, sheetRef.current);
      toast.success("Quotation PDF downloaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate the PDF",
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleSave() {
    const error = validateQuotationDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    setSaveStep(0);
    try {
      const file = await buildQuotationPdfBlob(
        draft,
        company,
        sheetRef.current,
      );
      setSaveStep(1);
      const uploaded = await uploadQuotationPdf(file);
      setSaveStep(2);
      const payload = draftToCreatePayload(draft, uploaded);

      if (mode === "create") {
        let created = await createQuotation(payload);
        if (created.quotationNumber !== draft.quoteNumber) {
          try {
            const syncedDraft = {
              ...draft,
              quoteNumber: created.quotationNumber,
            };
            flushSync(() => setDraft(syncedDraft));
            const syncedFile = await buildQuotationPdfBlob(
              syncedDraft,
              company,
              sheetRef.current,
            );
            const resynced = await uploadQuotationPdf(syncedFile);
            created = await updateQuotation(created.id, {
              pdfUrl: resynced.url,
              pdfStorageKey: resynced.key,
            });
          } catch {
            toast.warning(
              "Saved, but the PDF quote number may not match the official number.",
            );
          }
        }
        await queryClient.invalidateQueries({
          queryKey: queryKeys.quotations.all,
        });
        setSaveStep(4);
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        navigate(`/quotations/${created.id}`);
        return;
      }

      const updated = await updateQuotation(quotation.id, payload);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.all,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotation.id),
      });
      setSaveStep(4);
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      navigate(`/quotations/${updated.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save the quotation",
      );
      setSaving(false);
    }
  }

  const busy = downloading || saving;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader
        title={mode === "edit" ? "Edit quotation" : "Create quotation"}
        description={
          mode === "edit"
            ? "Update customer details or products, then save to regenerate the PDF."
            : "Fill customer details and products. Preview or download the PDF, then save."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              render={
                <Link to={backTo}>
                  <ArrowLeft />
                  Back
                </Link>
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft(
                  quotation
                    ? quotationToDraft(quotation)
                    : createEmptyQuotationDraft(),
                )
              }
            >
              <RotateCcw />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDownload()}
              disabled={busy}
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
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save quotation
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>
              Quote {draft.quoteNumber}. Name, mobile, email, and address are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuotationCustomerFields draft={draft} onChange={patchDraft} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Search the catalog, add multiple items, and override unit prices
              if needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuotationLineItemsEditor
              items={draft.items}
              onChange={(items) => patchDraft({ items })}
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
        <div ref={sheetRef} data-quotation-sheet style={{ width: "210mm" }}>
          <QuotationPreview draft={draft} company={company} />
        </div>
      </div>

      <QuotationSaveProgressDialog open={saving} currentStep={saveStep} />
      <QuotationPreviewDialog
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
