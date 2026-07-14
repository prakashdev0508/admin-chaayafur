import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadSupportImage } from "@/services/uploads.service";
import type { SupportTicketAttachment } from "@/types/support-ticket";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type ImageSlot = {
  clientId: string;
  url: string;
  storageKey: string;
  sortOrder: number;
  previewUrl?: string;
  uploadState: "uploading" | "ready" | "error";
};

type SupportImageUploaderProps = {
  attachments: SupportTicketAttachment[];
  onChange: (attachments: SupportTicketAttachment[]) => void;
  disabled?: boolean;
  required?: boolean;
};

function createClientId() {
  return `support-img-${crypto.randomUUID()}`;
}

function slotsToAttachments(slots: ImageSlot[]): SupportTicketAttachment[] {
  return slots
    .filter((slot) => slot.uploadState === "ready")
    .map((slot, index) => ({
      url: slot.url,
      storageKey: slot.storageKey,
      sortOrder: index,
    }));
}

export function SupportImageUploader({
  attachments,
  onChange,
  disabled,
  required,
}: SupportImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<ImageSlot[]>(() =>
    attachments.map((attachment, index) => ({
      clientId: createClientId(),
      url: attachment.url,
      storageKey: attachment.storageKey,
      sortOrder: attachment.sortOrder ?? index,
      uploadState: "ready" as const,
    })),
  );

  const updateSlots = useCallback(
    (next: ImageSlot[] | ((current: ImageSlot[]) => ImageSlot[])) => {
      setSlots((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        onChange(slotsToAttachments(resolved));
        return resolved;
      });
    },
    [onChange],
  );

  const uploadFile = useCallback(
    async (file: File, clientId: string) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      updateSlots((current) =>
        current.map((slot) =>
          slot.clientId === clientId
            ? { ...slot, previewUrl, uploadState: "uploading" as const }
            : slot,
        ),
      );

      try {
        const result = await uploadSupportImage(file);
        updateSlots((current) =>
          current.map((slot) =>
            slot.clientId === clientId
              ? {
                  ...slot,
                  url: result.url,
                  storageKey: result.storageKey,
                  uploadState: "ready" as const,
                }
              : slot,
          ),
        );
      } catch (error) {
        updateSlots((current) =>
          current.map((slot) =>
            slot.clientId === clientId
              ? { ...slot, uploadState: "error" as const }
              : slot,
          ),
        );
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    },
    [updateSlots],
  );

  function handleFilesSelected(files: FileList | null) {
    if (!files || disabled) return;

    const remaining = MAX_IMAGES - slots.length;
    const selected = Array.from(files).slice(0, remaining);

    selected.forEach((file) => {
      const clientId = createClientId();
      updateSlots((current) => [
        ...current,
        {
          clientId,
          url: "",
          storageKey: "",
          sortOrder: current.length,
          previewUrl: URL.createObjectURL(file),
          uploadState: "uploading",
        },
      ]);
      void uploadFile(file, clientId);
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const isUploading = slots.some((slot) => slot.uploadState === "uploading");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Proof images
          {required ? " (required)" : " (optional)"}
        </p>
        <span className="text-xs text-muted-foreground">
          {slots.length}/{MAX_IMAGES}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <div
            key={slot.clientId}
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30"
          >
            {(slot.previewUrl || slot.url) && (
              <img
                src={slot.previewUrl || slot.url}
                alt="Support proof"
                className="size-full object-cover"
              />
            )}
            {slot.uploadState === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            {!disabled && slot.uploadState !== "uploading" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1 right-1 bg-background/80"
                onClick={() =>
                  updateSlots((current) =>
                    current.filter((entry) => entry.clientId !== slot.clientId),
                  )
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ))}

        {slots.length < MAX_IMAGES && !disabled && (
          <button
            type="button"
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground",
              isUploading && "pointer-events-none opacity-60",
            )}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Add photo
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />
    </div>
  );
}
