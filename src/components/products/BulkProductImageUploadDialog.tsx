import { useState } from "react";
import { Link } from "react-router-dom";
import { BulkProductImageZipUploader } from "@/components/products/BulkProductImageZipUploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BulkProductImageUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkProductImageUploadDialog({
  open,
  onOpenChange,
}: BulkProductImageUploadDialogProps) {
  const [enqueuedJobId, setEnqueuedJobId] = useState<number | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEnqueuedJobId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[min(90vh,680px)] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk upload product images</DialogTitle>
          <DialogDescription>
            Upload a ZIP of product photos. Files are matched to products by
            slug when you import the Excel sheet. Manage staged files on the{" "}
            <Link
              to="/products/bulk-prepare"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => onOpenChange(false)}
            >
              Prepare bulk import
            </Link>{" "}
            screen.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto py-1">
          <BulkProductImageZipUploader onJobEnqueued={setEnqueuedJobId} />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant={enqueuedJobId ? "default" : "outline"}
            onClick={() => onOpenChange(false)}
          >
            {enqueuedJobId ? "Done" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
