import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadCustomizationImage } from "@/services/uploads.service";
import type { ReferenceImage } from "@/types/customization-request";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CustomizationImageUploaderProps = {
  image: ReferenceImage | null;
  onChange: (image: ReferenceImage | null) => void;
  disabled?: boolean;
};

export function CustomizationImageUploader({
  image,
  onChange,
  disabled,
}: CustomizationImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, and WebP images are allowed");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setUploading(true);

      try {
        const result = await uploadCustomizationImage(file);
        onChange({ url: result.url, storageKey: result.storageKey });
      } catch (error) {
        setPreviewUrl(null);
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleFilesSelected(files: FileList | null) {
    if (!files?.[0] || disabled || uploading) return;
    void uploadFile(files[0]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const displayUrl = previewUrl || image?.url;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#3D2B1F]">
        Reference image (optional)
      </p>
      <div className="flex gap-3">
        {displayUrl ? (
          <div className="relative aspect-square w-32 overflow-hidden rounded-xl border border-[#E8DFD3]">
            <img
              src={displayUrl}
              alt="Reference"
              className="size-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            {!disabled && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1 right-1 bg-white/90"
                onClick={() => {
                  onChange(null);
                  setPreviewUrl(null);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            className={cn(
              "flex aspect-square w-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D9CBB8] text-xs text-muted-foreground transition hover:border-[#8B5E3C] hover:text-[#3D2B1F]",
              uploading && "pointer-events-none opacity-60",
            )}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                Add photo
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />
    </div>
  );
}
