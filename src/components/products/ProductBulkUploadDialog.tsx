import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { bulkUploadProducts } from "@/services/products.service";
import type { ProductBulkUploadResult } from "@/types/product";

const MAX_XLSX_MB = 5;
const STEPS = ["Import", "Results"] as const;
type StepIndex = 0 | 1;

type ProductBulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (result: ProductBulkUploadResult) => void;
};

function validateXlsxFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return "Upload an Excel .xlsx file";
  }
  if (file.size === 0) {
    return "File is empty";
  }
  if (file.size > MAX_XLSX_MB * 1024 * 1024) {
    return `File must be under ${MAX_XLSX_MB} MB`;
  }
  return null;
}

export function ProductBulkUploadDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ProductBulkUploadDialogProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepIndex>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductBulkUploadResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSelectedFile(null);
    setIsDragging(false);
    setImporting(false);
    setImportError(null);
    setResult(null);
  }, [open]);

  const assignFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setImportError(null);
      return;
    }
    const validationError = validateXlsxFile(file);
    if (validationError) {
      setSelectedFile(null);
      setImportError(validationError);
      toast.error(validationError);
      return;
    }
    setSelectedFile(file);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setImportError("Choose an .xlsx file to import");
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      const data = await bulkUploadProducts(selectedFile);
      setResult(data);
      setStep(1);
      if (data.failedCount === 0) {
        toast.success(`Imported ${data.successCount} products`);
      } else {
        toast.message(
          `${data.successCount} succeeded, ${data.failedCount} failed — download the result file for details`,
        );
      }
      onImportSuccess?.(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Import failed";
      setImportError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (importing) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[min(90vh,640px)] grid-rows-[auto_auto_1fr_auto] overflow-hidden"
        showCloseButton={!importing}
      >
        <DialogHeader>
          <DialogTitle>Bulk upload products</DialogTitle>
          <DialogDescription>
            Upload a completed Excel file. Prepare your template, image URLs, and
            IDs on the{" "}
            <Link
              to="/products/bulk-prepare"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => onOpenChange(false)}
            >
              Prepare bulk import
            </Link>{" "}
            screen first.
          </DialogDescription>
        </DialogHeader>

        <nav aria-label="Bulk upload steps" className="flex gap-2">
          {STEPS.map((label, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <div
                key={label}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-center text-xs",
                  active && "bg-muted font-medium",
                  !active && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px]",
                    active && "bg-primary text-primary-foreground",
                    done && !active && "bg-primary/15 text-primary",
                    !active && !done && "bg-muted",
                  )}
                >
                  {done && !active ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </div>
            );
          })}
        </nav>

        <div className="min-h-0 overflow-y-auto py-1">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Submit your filled{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  .xlsx
                </code>{" "}
                (max {MAX_XLSX_MB} MB, 500 data rows). Failed rows do not stop
                the batch — check the result file afterward.
              </p>

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDragging(false);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) assignFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-full border bg-background">
                  <FileSpreadsheet className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {selectedFile
                      ? selectedFile.name
                      : "Drop your .xlsx file here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB · click to change`
                      : `or click to browse · max ${MAX_XLSX_MB} MB`}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <Upload className="size-4" />
                  Choose file
                </Button>
              </div>

              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(e) => {
                  assignFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
                disabled={importing}
              />

              {importError && (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {importError}
                </p>
              )}
            </div>
          )}

          {step === 1 && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Succeeded
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {result.successCount}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <XCircle className="size-4" />
                    Failed
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {result.failedCount}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                The result workbook includes a{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  status
                </code>{" "}
                column with Success or the error message for each row.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                render={
                  <a
                    href={result.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Download result Excel
                  </a>
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importing}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={importing || !selectedFile}
                onClick={() => void handleImport()}
              >
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {importing ? "Importing…" : "Import products"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
