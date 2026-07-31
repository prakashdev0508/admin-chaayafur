import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUploadJob } from "@/hooks/useUploadJob";
import { ApiError } from "@/lib/api";
import { triggerBrowserDownload } from "@/lib/download";
import { queryKeys } from "@/lib/query-keys";
import {
  uploadJobStatusLabels,
  uploadJobStatusVariants,
} from "@/lib/upload-job-status";
import { cn } from "@/lib/utils";
import { bulkUploadProducts } from "@/services/products.service";
import { downloadUploadJobFile } from "@/services/upload-jobs.service";
import type { UploadJob } from "@/types/upload-job";
import { isTerminalUploadJobStatus } from "@/types/upload-job";

const MAX_XLSX_MB = 5;
const STEPS = ["Upload", "Processing", "Results"] as const;
type StepIndex = 0 | 1 | 2;

type ProductBulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (job: UploadJob) => void;
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
  const queryClient = useQueryClient();
  const [step, setStep] = useState<StepIndex>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enqueueing, setEnqueueing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [downloadingResult, setDownloadingResult] = useState(false);
  const [notifiedTerminal, setNotifiedTerminal] = useState(false);

  const jobQuery = useUploadJob(open ? jobId : null);
  const job = jobQuery.data ?? null;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSelectedFile(null);
    setEnqueueing(false);
    setImportError(null);
    setJobId(null);
    setDownloadingResult(false);
    setNotifiedTerminal(false);
  }, [open]);

  useEffect(() => {
    if (!job || !isTerminalUploadJobStatus(job.status)) return;
    setStep(2);
    if (notifiedTerminal) return;
    setNotifiedTerminal(true);

    if (job.status === "FAILED") {
      toast.error(job.errorMessage || "Import job failed");
    } else if (job.failedCount === 0) {
      toast.success(`Imported ${job.successCount} products`);
    } else {
      toast.message(
        `${job.successCount} succeeded, ${job.failedCount} failed — download the result file for details`,
      );
    }
    onImportSuccess?.(job);
  }, [job, notifiedTerminal, onImportSuccess]);

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

    setEnqueueing(true);
    setImportError(null);
    try {
      const data = await bulkUploadProducts(selectedFile);
      setJobId(data.jobId);
      setStep(1);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.uploadJobs.all,
      });
      toast.message("Import queued — processing in the background");
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
      setEnqueueing(false);
    }
  };

  const handleDownloadResult = async () => {
    if (!job) return;
    setDownloadingResult(true);
    try {
      const { blob, filename } = await downloadUploadJobFile(job.id, "result");
      triggerBrowserDownload(
        blob,
        filename || "product-bulk-upload-result.xlsx",
      );
      toast.success("Result workbook downloaded");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to download result";
      toast.error(message);
    } finally {
      setDownloadingResult(false);
    }
  };

  const isBusy = enqueueing || (step === 1 && jobId != null);

  const handleClose = (nextOpen: boolean) => {
    if (isBusy && nextOpen === false) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[min(90vh,640px)] grid-rows-[auto_auto_1fr_auto] overflow-hidden"
        showCloseButton={!isBusy}
      >
        <DialogHeader>
          <DialogTitle>Bulk upload products</DialogTitle>
          <DialogDescription>
            Upload a completed Excel file. Stage images and prepare your
            template on the{" "}
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
                (max {MAX_XLSX_MB} MB, 500 data rows). Images are attached from
                staged ZIP uploads matching each product slug.
              </p>

              <FileDropzone
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                label="Drop your .xlsx file here"
                hint={`or click to browse · max ${MAX_XLSX_MB} MB`}
                file={selectedFile}
                onFile={assignFile}
                disabled={enqueueing}
                icon={
                  <FileSpreadsheet className="size-5 text-muted-foreground" />
                }
              />

              {importError && (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {importError}
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 py-4 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Processing import…</p>
                {job && (
                  <>
                    <StatusBadge
                      variant={uploadJobStatusVariants[job.status]}
                    >
                      {uploadJobStatusLabels[job.status]}
                    </StatusBadge>
                    {job.totalCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {job.successCount + job.failedCount} of {job.totalCount}{" "}
                        rows processed
                        {job.failedCount > 0
                          ? ` · ${job.failedCount} failed so far`
                          : ""}
                      </p>
                    )}
                  </>
                )}
                {!job && jobQuery.isLoading && (
                  <p className="text-xs text-muted-foreground">
                    Waiting for worker…
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && job && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Succeeded
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {job.successCount}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <XCircle className="size-4" />
                    Failed
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {job.failedCount}
                  </p>
                </div>
              </div>

              <StatusBadge variant={uploadJobStatusVariants[job.status]}>
                {uploadJobStatusLabels[job.status]}
              </StatusBadge>

              {job.errorMessage && (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {job.errorMessage}
                </p>
              )}

              {job.status !== "FAILED" && (
                <p className="text-sm text-muted-foreground">
                  The result workbook includes{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    imagesAttached
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    status
                  </code>{" "}
                  columns for each row.
                </p>
              )}

              {job.resultUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled={downloadingResult}
                  onClick={() => void handleDownloadResult()}
                >
                  {downloadingResult ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download result Excel
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 2 ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : step === 1 ? (
            <Button
              type="button"
              variant="outline"
              render={
                <Link to="/upload-jobs" onClick={() => onOpenChange(false)}>
                  <ExternalLink className="size-4" />
                  Run in background
                </Link>
              }
            />
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={enqueueing}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={enqueueing || !selectedFile}
                onClick={() => void handleImport()}
              >
                {enqueueing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {enqueueing ? "Queuing…" : "Import products"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
