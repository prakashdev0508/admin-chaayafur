import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { exportReport } from "@/services/reports.service";
import type { ReportKind } from "@/types/reports";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ReportExportButtonProps = {
  kind: ReportKind;
  params: Record<string, unknown>;
  disabled?: boolean;
};

export function ReportExportButton({
  kind,
  params,
  disabled,
}: ReportExportButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={disabled || loading}
      onClick={async () => {
        setLoading(true);
        try {
          const { blob, filename } = await exportReport(kind, params);
          triggerBrowserDownload(blob, filename);
          toast.success("Export downloaded");
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Export failed";
          toast.error(message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Export Excel
    </Button>
  );
}
