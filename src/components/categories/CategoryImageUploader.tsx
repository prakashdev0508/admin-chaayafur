import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadCategoryImage } from "@/services/uploads.service";
import type { CategoryImageInput } from "@/types/category";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type CategoryImageUploaderProps = {
  image: CategoryImageInput | null;
  previewUrl?: string | null;
  onChange: (image: CategoryImageInput | null) => void;
  disabled?: boolean;
};

export function CategoryImageUploader({
  image,
  previewUrl,
  onChange,
  disabled,
}: CategoryImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || image?.url || previewUrl || null;

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use JPG, PNG, WEBP, or GIF");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_FILE_SIZE_MB} MB`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);

    try {
      const result = await uploadCategoryImage(file);
      onChange({
        url: result.url,
        storageKey: result.storageKey,
      });
      toast.success("Category image uploaded");
    } catch (error) {
      onChange(null);
      setLocalPreview(null);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Category image</Label>
      <p className="text-xs text-muted-foreground">
        Optional. Upload first, then save the category.
      </p>

      {displayUrl ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img
            src={displayUrl}
            alt="Category"
            className="aspect-[16/10] w-full object-cover"
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
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
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
          className={cn(
            "flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground",
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
        disabled={disabled || uploading}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
