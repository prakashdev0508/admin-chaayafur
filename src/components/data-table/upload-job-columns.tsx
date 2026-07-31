import { type ColumnDef } from "@tanstack/react-table";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import {
  uploadJobStatusLabels,
  uploadJobStatusVariants,
  uploadJobTypeLabels,
} from "@/lib/upload-job-status";
import type { UploadJob } from "@/types/upload-job";

export type UploadJobDownloadKind = "uploaded" | "result";

export type UploadJobColumnActions = {
  downloadingKey: string | null;
  onDownload: (job: UploadJob, kind: UploadJobDownloadKind) => void;
};

function formatDuration(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt || !finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

export function createUploadJobColumns(
  actions: UploadJobColumnActions,
): ColumnDef<UploadJob>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "File",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {uploadJobTypeLabels[row.original.type]}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={uploadJobStatusVariants[row.original.status]}>
          {uploadJobStatusLabels[row.original.status]}
        </StatusBadge>
      ),
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const { successCount, failedCount, totalCount, attempts } =
          row.original;
        return (
          <div className="text-sm tabular-nums">
            <span className="text-emerald-700 dark:text-emerald-400">
              {successCount}
            </span>
            {" / "}
            <span className="text-destructive">{failedCount}</span>
            {" / "}
            <span className="text-muted-foreground">{totalCount}</span>
            {attempts > 1 && (
              <p className="text-xs text-muted-foreground">
                Attempt {attempts}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) =>
        formatDuration(row.original.startedAt, row.original.finishedAt),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "downloads",
      header: "Downloads",
      cell: ({ row }) => {
        const job = row.original;
        const uploadedKey = `${job.id}:uploaded`;
        const resultKey = `${job.id}:result`;
        return (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={actions.downloadingKey === uploadedKey}
              onClick={() => actions.onDownload(job, "uploaded")}
            >
              {actions.downloadingKey === uploadedKey ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Download className="size-3" />
              )}
              Uploaded
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={
                !job.resultUrl || actions.downloadingKey === resultKey
              }
              onClick={() => actions.onDownload(job, "result")}
            >
              {actions.downloadingKey === resultKey ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Download className="size-3" />
              )}
              Result
            </Button>
          </div>
        );
      },
    },
  ];
}
