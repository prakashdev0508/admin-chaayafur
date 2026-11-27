import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MediaImageInput } from "@/types/media";
import type { ProductImageUploadResult } from "@/types/upload";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type MediaImageFieldProps = {
  image: MediaImageInput | null;
  onChange: (image: MediaImageInput | null) => void;
  upload: (file: File) => Promise<ProductImageUploadResult>;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  aspectClassName?: string;
  previewFrameClassName?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

export function MediaImageField({
  image,
  onChange,
  upload,
  label,
  hint = "JPG, PNG, or WEBP. Uploads before you save.",
  required,
  disabled,
  aspectClassName = "aspect-video",
  previewFrameClassName,
  onUploadingChange,
}: MediaImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || image?.url || null;

  function setUploadingState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use JPG, PNG, or WEBP");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_FILE_SIZE_MB} MB`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploadingState(true);

    try {
      const result = await upload(file);
      onChange({
        url: result.url,
        storageKey: result.storageKey,
      });
      toast.success("Image uploaded");
    } catch (error) {
      setLocalPreview(null);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingState(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={inputId}>
          {label}
          {required ? " *" : ""}
        </Label>
      ) : null}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}

      {displayUrl ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted/30",
            previewFrameClassName,
          )}
        >
          <img
            src={displayUrl}
            alt=""
            className={cn(aspectClassName, "w-full object-cover")}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          {!disabled && !uploading && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="Replace image"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="Remove image"
                onClick={() => {
                  setLocalPreview(null);
                  onChange(null);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          aria-label={label ? `${label}${required ? " (required)" : ""}` : "Upload image"}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground",
            aspectClassName,
            previewFrameClassName,
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {uploading ? "Uploading..." : "Upload image"}
        </button>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
