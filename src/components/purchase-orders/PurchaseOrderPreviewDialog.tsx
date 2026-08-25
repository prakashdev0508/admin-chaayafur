import { Download, Loader2, X } from "lucide-react";
import { PurchaseOrderPreview } from "@/components/purchase-orders/PurchaseOrderPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  PurchaseOrderCompanyInfo,
  PurchaseOrderDraft,
} from "@/types/purchase-order";

type PurchaseOrderPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: PurchaseOrderDraft;
  company: PurchaseOrderCompanyInfo;
  downloading?: boolean;
  onDownload: () => void;
};

export function PurchaseOrderPreviewDialog({
  open,
  onOpenChange,
  draft,
  company,
  downloading = false,
  onDownload,
}: PurchaseOrderPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 py-3">
          <div>
            <DialogTitle>Purchase order preview</DialogTitle>
            <DialogDescription>
              {draft.poNumber} — this is how the PDF will look.
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              onClick={onDownload}
              disabled={downloading}
            >
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close preview"
            >
              <X />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#5c5c5c] px-4 py-6">
          <div className="mx-auto w-full max-w-[210mm] shadow-2xl">
            <PurchaseOrderPreview draft={draft} company={company} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
