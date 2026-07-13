import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/services/uploads.service";
import type { ProductImageInput } from "@/types/product";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type ImageSlot = {
  clientId: string;
  url: string;
  storageKey?: string;
  altText: string;
  sortOrder: number;
  previewUrl?: string;
  uploadState: "uploading" | "ready" | "error";
  uploadError?: string;
  pendingFile?: File;
};

type ProductImageUploaderProps = {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
  productName?: string;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
};

function createClientId() {
  return `img-${crypto.randomUUID()}`;
}

function toSlots(images: ProductImageInput[]): ImageSlot[] {
  return images.map((image, index) => ({
    clientId: createClientId(),
    url: image.url,
    storageKey: image.storageKey,
    altText: image.altText,
    sortOrder: image.sortOrder ?? index,
    uploadState: "ready" as const,
  }));
}

function slotsToImages(slots: ImageSlot[]): ProductImageInput[] {
  return slots
    .filter((slot) => slot.uploadState === "ready" && slot.url.trim())
    .map((slot, index) => ({
      url: slot.url,
      storageKey: slot.storageKey,
      altText: slot.altText,
      sortOrder: index,
    }));
}

function defaultAltText(fileName: string, productName?: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (productName?.trim()) {
    return `${productName.trim()} — ${base}`;
  }
  return base;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use JPG, PNG, WEBP, or GIF";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Each image must be under ${MAX_FILE_SIZE_MB} MB`;
  }
  return null;
}

export function ProductImageUploader({
  images,
  onChange,
  productName,
  disabled,
  onUploadingChange,
}: ProductImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<ImageSlot[]>(() => toSlots(images));
  const [isDragging, setIsDragging] = useState(false);
  const slotsRef = useRef(slots);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((slot) => {
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      });
    };
  }, []);

  const emitChange = useCallback(
    (nextSlots: ImageSlot[]) => {
      setSlots(nextSlots);
      onChange(slotsToImages(nextSlots));
    },
    [onChange],
  );

  const uploadSlot = useCallback(
    async (clientId: string, file: File) => {
      const previewUrl = URL.createObjectURL(file);

      setSlots((current) =>
        current.map((slot) =>
          slot.clientId === clientId
            ? {
                ...slot,
                previewUrl,
                uploadState: "uploading",
                uploadError: undefined,
                pendingFile: file,
              }
            : slot,
        ),
      );

      try {
        const uploaded = await uploadProductImage(file);
        setSlots((current) => {
          const next = current.map((slot) => {
            if (slot.clientId !== clientId) return slot;
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
          });
          onChange(slotsToImages(next));
          return next;
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload image";
        setSlots((current) =>
          current.map((slot) =>
            slot.clientId === clientId
              ? { ...slot, uploadState: "error", uploadError: message }
              : slot,
          ),
        );
        toast.error(message);
      }
    },
    [onChange],
  );

  const queueFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const available = MAX_IMAGES - slotsRef.current.length;
      if (available <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      const toAdd = fileArray.slice(0, available);
      if (fileArray.length > available) {
        toast.message(`Only ${available} more image${available === 1 ? "" : "s"} can be added`);
      }

      const newSlots: ImageSlot[] = [];

      for (const file of toAdd) {
        const validationError = validateFile(file);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          continue;
        }

        const clientId = createClientId();
        newSlots.push({
          clientId,
          url: "",
          altText: defaultAltText(file.name, productName),
          sortOrder: slotsRef.current.length + newSlots.length,
          uploadState: "uploading",
          pendingFile: file,
        });
      }

      if (newSlots.length === 0) return;

      const merged = [...slotsRef.current, ...newSlots];
      setSlots(merged);

      for (const slot of newSlots) {
        if (slot.pendingFile) {
          void uploadSlot(slot.clientId, slot.pendingFile);
        }
      }
    },
    [productName, uploadSlot],
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
      const next = current.filter((slot) => slot.clientId !== clientId);
      onChange(slotsToImages(next));
      return next;
    });
  };

  const updateAltText = (clientId: string, altText: string) => {
    emitChange(
      slots.map((slot) =>
        slot.clientId === clientId ? { ...slot, altText } : slot,
      ),
    );
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slots.length) return;

    const next = [...slots];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    emitChange(next);
  };

  const retryUpload = (slot: ImageSlot) => {
    if (!slot.pendingFile) return;
    void uploadSlot(slot.clientId, slot.pendingFile);
  };

  const readyCount = slots.filter((slot) => slot.uploadState === "ready").length;
  const isUploading = slots.some((slot) => slot.uploadState === "uploading");
  const canAddMore = slots.length < MAX_IMAGES && !disabled;

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Product images</CardTitle>
            <CardDescription>
              Upload up to {MAX_IMAGES} photos. The first image is used as the
              cover on the storefront.
            </CardDescription>
          </div>
          <div className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            {readyCount} / {MAX_IMAGES}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {slots.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot, index) => {
              const preview = slot.url || slot.previewUrl;
              const isCover = index === 0;

              return (
                <div
                  key={slot.clientId}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-muted/20",
                    slot.uploadState === "error" && "border-destructive/50",
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                    {preview ? (
                      <img
                        src={preview}
                        alt={slot.altText || "Product image preview"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="size-8 opacity-40" />
                      </div>
                    )}

                    {isCover && slot.uploadState === "ready" && (
                      <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground shadow-sm">
                        <Star className="size-3 fill-current" />
                        Cover
                      </div>
                    )}

                    {slot.uploadState === "uploading" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-[1px]">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                          Uploading…
                        </span>
                      </div>
                    )}

                    {slot.uploadState === "error" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/10 p-3 text-center">
                        <AlertCircle className="size-5 text-destructive" />
                        <p className="text-xs text-destructive">
                          {slot.uploadError ?? "Upload failed"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(slot)}
                        >
                          <RefreshCw className="size-3.5" />
                          Retry
                        </Button>
                      </div>
                    )}

                    {!disabled && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="bg-background/90"
                          disabled={index === 0}
                          onClick={() => moveSlot(index, -1)}
                          aria-label="Move image earlier"
                        >
                          <ArrowLeft className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="bg-background/90"
                          disabled={index === slots.length - 1}
                          onClick={() => moveSlot(index, 1)}
                          aria-label="Move image later"
                        >
                          <ArrowRight className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="bg-background/90 text-destructive hover:text-destructive"
                          onClick={() => removeSlot(slot.clientId)}
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3">
                    <Label
                      htmlFor={`${inputId}-alt-${slot.clientId}`}
                      className="text-xs text-muted-foreground"
                    >
                      Alt text
                    </Label>
                    <Input
                      id={`${inputId}-alt-${slot.clientId}`}
                      value={slot.altText}
                      onChange={(e) =>
                        updateAltText(slot.clientId, e.target.value)
                      }
                      placeholder="Describe this photo for accessibility"
                      disabled={disabled || slot.uploadState === "uploading"}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canAddMore && (
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
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full border bg-background">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {slots.length === 0
                  ? "Drop product photos here"
                  : "Add more photos"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse · JPG, PNG, WEBP, GIF · max {MAX_FILE_SIZE_MB}{" "}
                MB each
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" tabIndex={-1}>
              <ImagePlus className="size-4" />
              Choose files
            </Button>
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
          disabled={disabled || !canAddMore}
        />

        {isUploading && (
          <p className="text-xs text-muted-foreground">
            Uploading images… save is available once all uploads finish.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
