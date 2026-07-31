import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CheckCircle2,
  Download,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUploadJob } from "@/hooks/useUploadJob";
import { ApiError } from "@/lib/api";
import { triggerBrowserDownload } from "@/lib/download";
import { queryKeys } from "@/lib/query-keys";
import {
  uploadJobStatusLabels,
  uploadJobStatusVariants,
} from "@/lib/upload-job-status";
import { stageBulkProductImages } from "@/services/products.service";
import { downloadUploadJobFile } from "@/services/upload-jobs.service";
import { isTerminalUploadJobStatus } from "@/types/upload-job";

const MAX_ZIP_MB = 50;

function validateZipFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".zip")) {
    return "Upload a .zip archive";
  }
  if (file.size === 0) {
    return "File is empty";
  }
  if (file.size > MAX_ZIP_MB * 1024 * 1024) {
    return `ZIP must be under ${MAX_ZIP_MB} MB`;
  }
  return null;
}

type BulkProductImageZipUploaderProps = {
  disabled?: boolean;
  onJobEnqueued?: (jobId: number) => void;
};

export function BulkProductImageZipUploader({
  disabled = false,
  onJobEnqueued,
}: BulkProductImageZipUploaderProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enqueueing, setEnqueueing] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [downloadingResult, setDownloadingResult] = useState(false);
  const [invalidated, setInvalidated] = useState(false);

  const jobQuery = useUploadJob(jobId);
  const job = jobQuery.data ?? null;
  const terminal = job ? isTerminalUploadJobStatus(job.status) : false;

  useEffect(() => {
    if (!job || !terminal || invalidated) return;
    setInvalidated(true);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.stagedProductImages.all,
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.uploadJobs.all,
    });
    if (job.status === "FAILED") {
      toast.error(job.errorMessage || "Image staging failed");
    } else if (job.failedCount === 0) {
      toast.success(`Staged ${job.successCount} images`);
    } else {
      toast.message(
        `${job.successCount} staged, ${job.failedCount} failed — download the result for details`,
      );
    }
  }, [job, terminal, invalidated, queryClient]);

  const assignFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      return;
    }
    const validationError = validateZipFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Choose a .zip file to stage");
      return;
    }
    setEnqueueing(true);
    setError(null);
    setInvalidated(false);
    try {
      const data = await stageBulkProductImages(selectedFile);
      setJobId(data.jobId);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.uploadJobs.all,
      });
      onJobEnqueued?.(data.jobId);
      toast.message("Image ZIP queued for staging");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to queue ZIP";
      setError(message);
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
        filename || "product-image-staging-result.xlsx",
      );
      toast.success("Staging result downloaded");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to download result";
      toast.error(message);
    } finally {
      setDownloadingResult(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setJobId(null);
    setError(null);
    setInvalidated(false);
  };

  const isBusy = enqueueing || (jobId != null && !terminal);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Filename convention</p>
        <p className="mt-1">
          Name each file{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {"{productSlug}__{sortOrder}.{ext}"}
          </code>
          , then zip them. Examples:
        </p>
        <ul className="mt-2 space-y-0.5 font-mono">
          <li>oak-dining-table__0.jpg</li>
          <li>oak-dining-table__1.png</li>
          <li>velvet-sofa__0.webp</li>
        </ul>
        <p className="mt-2">
          Sort order <code className="rounded bg-muted px-1">0</code>–
          <code className="rounded bg-muted px-1">4</code> (max 5 images per
          product). Max {MAX_ZIP_MB} MB / 200 files. Extensions: jpg, jpeg, png,
          webp.
        </p>
      </div>

      {!jobId && (
        <>
          <FileDropzone
            accept=".zip,application/zip,application/x-zip-compressed"
            label="Drop your images .zip here"
            hint={`or click to browse · max ${MAX_ZIP_MB} MB`}
            file={selectedFile}
            onFile={assignFile}
            disabled={disabled || enqueueing}
            icon={<Archive className="size-5 text-muted-foreground" />}
          />

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="button"
            disabled={disabled || enqueueing || !selectedFile}
            onClick={() => void handleUpload()}
          >
            {enqueueing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {enqueueing ? "Queuing…" : "Stage images"}
          </Button>
        </>
      )}

      {jobId != null && !terminal && (
        <div className="space-y-3 rounded-lg border p-4 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Staging images…</p>
          {job && (
            <>
              <StatusBadge variant={uploadJobStatusVariants[job.status]}>
                {uploadJobStatusLabels[job.status]}
              </StatusBadge>
              {job.totalCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {job.successCount + job.failedCount} of {job.totalCount} files
                </p>
              )}
            </>
          )}
        </div>
      )}

      {jobId != null && terminal && job && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={uploadJobStatusVariants[job.status]}>
              {uploadJobStatusLabels[job.status]}
            </StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Staged
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {job.successCount}
              </p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <XCircle className="size-3.5" />
                Failed
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {job.failedCount}
              </p>
            </div>
          </div>
          {job.errorMessage && (
            <p className="text-sm text-destructive">{job.errorMessage}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {job.resultUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloadingResult}
                onClick={() => void handleDownloadResult()}
              >
                {downloadingResult ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download result
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleReset}
            >
              Stage another ZIP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
