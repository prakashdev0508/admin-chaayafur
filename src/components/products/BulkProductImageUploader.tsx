import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckSquare,
  Copy,
  ImagePlus,
  Loader2,
  RefreshCw,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uploadProductImage,
  uploadProductImagesBatch,
} from "@/services/uploads.service";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BATCH_SIZE = 5;

type ImageSlot = {
  clientId: string;
  fileName: string;
  url: string;
  storageKey?: string;
  previewUrl?: string;
  uploadState: "uploading" | "ready" | "error";
  uploadError?: string;
  pendingFile?: File;
  selected: boolean;
};

function createClientId() {
  return `bulk-img-${crypto.randomUUID()}`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use JPG, PNG, or WEBP";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Each image must be under ${MAX_FILE_SIZE_MB} MB`;
  }
  return null;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

type BulkProductImageUploaderProps = {
  disabled?: boolean;
};

export function BulkProductImageUploader({
  disabled,
}: BulkProductImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const slotsRef = useRef(slots);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((slot) => {
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      });
    };
  }, []);

  const uploadChunk = useCallback(async (chunk: ImageSlot[]) => {
    const files = chunk
      .map((slot) => slot.pendingFile)
      .filter((file): file is File => Boolean(file));
    if (files.length === 0) return;

    const clientIds = chunk.map((slot) => slot.clientId);

    setSlots((current) =>
      current.map((slot) =>
        clientIds.includes(slot.clientId)
          ? {
              ...slot,
              uploadState: "uploading" as const,
              uploadError: undefined,
            }
          : slot,
      ),
    );

    try {
      let results;
      try {
        results = await uploadProductImagesBatch(files);
      } catch {
        results = await Promise.all(files.map((file) => uploadProductImage(file)));
      }

      setSlots((current) =>
        current.map((slot) => {
          const index = clientIds.indexOf(slot.clientId);
          if (index === -1) return slot;
          const uploaded = results[index];
          if (!uploaded) {
            return {
              ...slot,
              uploadState: "error" as const,
              uploadError: "Upload returned no result",
            };
          }
          if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
          return {
            ...slot,
            url: uploaded.url,
            storageKey: uploaded.storageKey,
            uploadState: "ready" as const,
            uploadError: undefined,
            pendingFile: undefined,
            previewUrl: undefined,
          };
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload images";
      setSlots((current) =>
        current.map((slot) =>
          clientIds.includes(slot.clientId)
            ? { ...slot, uploadState: "error" as const, uploadError: message }
            : slot,
        ),
      );
      toast.error(message);
    }
  }, []);

  const queueFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const newSlots: ImageSlot[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          continue;
        }

        newSlots.push({
          clientId: createClientId(),
          fileName: file.name,
          url: "",
          previewUrl: URL.createObjectURL(file),
          uploadState: "uploading",
          pendingFile: file,
          selected: false,
        });
      }

      if (newSlots.length === 0) return;

      const merged = [...slotsRef.current, ...newSlots];
      setSlots(merged);

      for (let i = 0; i < newSlots.length; i += BATCH_SIZE) {
        void uploadChunk(newSlots.slice(i, i + BATCH_SIZE));
      }
    },
    [uploadChunk],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      queueFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      queueFiles(e.dataTransfer.files);
    }
  };

  const removeSlot = (clientId: string) => {
    setSlots((current) => {
      const target = current.find((slot) => slot.clientId === clientId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((slot) => slot.clientId !== clientId);
    });
  };

  const toggleSelect = (clientId: string) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.clientId === clientId && slot.uploadState === "ready"
          ? { ...slot, selected: !slot.selected }
          : slot,
      ),
    );
  };

  const readySlots = slots.filter((slot) => slot.uploadState === "ready");
  const selectedReady = readySlots.filter((slot) => slot.selected);
  const isUploading = slots.some((slot) => slot.uploadState === "uploading");
  const allReadySelected =
    readySlots.length > 0 && readySlots.every((slot) => slot.selected);

  const toggleSelectAllReady = () => {
    const next = !allReadySelected;
    setSlots((current) =>
      current.map((slot) =>
        slot.uploadState === "ready" ? { ...slot, selected: next } : slot,
      ),
    );
  };

  const handleCopyUrl = async (slot: ImageSlot) => {
    if (!slot.url) return;
    try {
      await copyText(slot.url);
      setCopiedId(slot.clientId);
      toast.success("URL copied");
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Could not copy URL");
    }
  };

  const handleCopySelected = async () => {
    const urls = selectedReady.map((slot) => slot.url);
    if (urls.length === 0) {
      toast.message("Select at least one ready image");
      return;
    }
    try {
      await copyText(urls.join(","));
      toast.success(
        urls.length === 1
          ? "URL copied"
          : `${urls.length} URLs copied (comma-separated)`,
      );
    } catch {
      toast.error("Could not copy URLs");
    }
  };

  const retryUpload = (slot: ImageSlot) => {
    if (!slot.pendingFile) return;
    void uploadChunk([{ ...slot }]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload images, then copy CDN URLs into the Excel{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">images</code>{" "}
        column (comma-separated, max 5 per product). This step is optional.
      </p>

      {readySlots.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleSelectAllReady}
            disabled={disabled}
          >
            {allReadySelected ? (
              <CheckSquare className="size-3.5" />
            ) : (
              <Square className="size-3.5" />
            )}
            {allReadySelected ? "Deselect all" : "Select all ready"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopySelected()}
            disabled={disabled || selectedReady.length === 0}
          >
            <Copy className="size-3.5" />
            Copy selected
            {selectedReady.length > 0 ? ` (${selectedReady.length})` : ""}
          </Button>
        </div>
      )}

      {slots.length > 0 && (
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {slots.map((slot) => {
            const preview = slot.url || slot.previewUrl;
            const isCopied = copiedId === slot.clientId;

            return (
              <div
                key={slot.clientId}
                className={cn(
                  "group relative flex gap-2 overflow-hidden rounded-lg border bg-muted/20 p-2",
                  slot.selected && "border-primary ring-1 ring-primary/30",
                  slot.uploadState === "error" && "border-destructive/50",
                )}
              >
                <button
                  type="button"
                  className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted/40"
                  onClick={() =>
                    slot.uploadState === "ready"
                      ? toggleSelect(slot.clientId)
                      : undefined
                  }
                  disabled={disabled || slot.uploadState !== "ready"}
                  aria-label={
                    slot.selected ? "Deselect image" : "Select image"
                  }
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={slot.fileName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="size-5 opacity-40" />
                    </div>
                  )}
                  {slot.uploadState === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </div>
                  )}
                  {slot.uploadState === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                      <AlertCircle className="size-4 text-destructive" />
                    </div>
                  )}
                  {slot.selected && (
                    <div className="absolute top-0.5 left-0.5 rounded bg-primary p-0.5 text-primary-foreground">
                      <Check className="size-2.5" />
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-medium">{slot.fileName}</p>
                  {slot.uploadState === "ready" && (
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {slot.url}
                    </p>
                  )}
                  {slot.uploadState === "error" && (
                    <p className="text-[10px] text-destructive">
                      {slot.uploadError ?? "Upload failed"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {slot.uploadState === "ready" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => void handleCopyUrl(slot)}
                        disabled={disabled}
                      >
                        {isCopied ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        Copy URL
                      </Button>
                    )}
                    {slot.uploadState === "error" && slot.pendingFile && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => retryUpload(slot)}
                        disabled={disabled}
                      >
                        <RefreshCw className="size-3" />
                        Retry
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => removeSlot(slot.clientId)}
                      disabled={disabled || slot.uploadState === "uploading"}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!disabled && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
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
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full border bg-background">
            <Upload className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {slots.length === 0
                ? "Drop product images here"
                : "Add more images"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP · max {MAX_FILE_SIZE_MB} MB each
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {isUploading && (
        <p className="text-xs text-muted-foreground">Uploading images…</p>
      )}
    </div>
  );
}
